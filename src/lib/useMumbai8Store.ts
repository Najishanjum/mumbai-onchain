import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Coach, Passenger, RegistrationInput, Seat } from '../types/mumbai8';
import {
  COACH_METADATA,
  INITIAL_APPROVED_PASSENGERS,
  INITIAL_PENDING_PASSENGERS,
  generateInitialCoaches,
} from '../data/mumbai8Data';

const STORAGE_KEY_PASSENGERS = 'mumbai8_approved_passengers_v1';
const STORAGE_KEY_PENDING = 'mumbai8_pending_applications_v1';
const STORAGE_KEY_CURRENT_USER = 'mumbai8_current_user_v1';

export function useMumbai8Store() {
  // Approved passengers state
  const [passengers, setPassengers] = useState<Passenger[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY_PASSENGERS);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error('Failed to parse saved passengers', e);
        }
      }
    }
    return INITIAL_APPROVED_PASSENGERS;
  });

  // Pending applications state
  const [pendingApplications, setPendingApplications] = useState<Passenger[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY_PENDING);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error('Failed to parse saved pending applications', e);
        }
      }
    }
    return INITIAL_PENDING_PASSENGERS;
  });

  // Current User (default to Najish Anjum MUM-0042 if none, or null if unregistered)
  const [currentUser, setCurrentUser] = useState<Passenger | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY_CURRENT_USER);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error(e);
        }
      }
    }
    // Default to Najish Anjum so the user can immediately experience the "YOU" seat MUM-0042 and boarding pass
    const defaultUser = INITIAL_APPROVED_PASSENGERS.find((p) => p.seatNumber === 'MUM-0042');
    return defaultUser || null;
  });

  // Navigation & UI state
  const [selectedCoachId, setSelectedCoachId] = useState<string>('C01');
  const [inspectedPassenger, setInspectedPassenger] = useState<Passenger | null>(null);
  const [inspectedSeat, setInspectedSeat] = useState<Seat | null>(null);
  const [viewMode, setViewMode] = useState<'exterior' | 'interior' | 'seat-map' | 'stats'>('exterior');
  const [isRegisterOpen, setIsRegisterOpen] = useState<boolean>(false);
  const [isBoardingPassOpen, setIsBoardingPassOpen] = useState<boolean>(false);
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [focusedSeatNumber, setFocusedSeatNumber] = useState<string | null>(null);
  const [isTransitioningScene, setIsTransitioningScene] = useState<boolean>(false);
  const [lastAssignedSeat, setLastAssignedSeat] = useState<string | null>(null);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PASSENGERS, JSON.stringify(passengers));
    } catch (e) {
      console.error(e);
    }
  }, [passengers]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PENDING, JSON.stringify(pendingApplications));
    } catch (e) {
      console.error(e);
    }
  }, [pendingApplications]);

  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(currentUser));
      } else {
        localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
      }
    } catch (e) {
      console.error(e);
    }
  }, [currentUser]);

  // Compute dynamic coaches and seats with current user highlighting
  const coaches: Coach[] = useMemo(() => {
    const rawCoaches = generateInitialCoaches(passengers);
    return rawCoaches.map((coach) => ({
      ...coach,
      seats: coach.seats.map((seat) => {
        let status = seat.status;
        if (currentUser && currentUser.seatNumber === seat.seatNumber) {
          status = 'you';
        }
        return {
          ...seat,
          status,
        };
      }),
    }));
  }, [passengers, currentUser]);

  // Total train metrics
  const totalCapacity = 120;
  const reservedCount = passengers.length;
  const availableCount = Math.max(0, totalCapacity - reservedCount);

  // Helper to determine next available sequential seat number
  const getNextSequentialSeatNumber = useCallback((): { seatNumber: string; coachId: string; coachName: string } | null => {
    const occupiedSeats = new Set(passengers.map((p) => p.seatNumber).filter(Boolean));
    for (let i = 1; i <= totalCapacity; i++) {
      const seatNumber = `MUM-${String(i).padStart(4, '0')}`;
      if (!occupiedSeats.has(seatNumber)) {
        const coachIdx = Math.floor((i - 1) / 20);
        const meta = COACH_METADATA[coachIdx] || COACH_METADATA[0];
        return {
          seatNumber,
          coachId: meta.id,
          coachName: meta.name,
        };
      }
    }
    return null;
  }, [passengers, totalCapacity]);

  // Submit new registration application
  const submitApplication = useCallback((input: RegistrationInput, autoApprove = false) => {
    const newPassengerId = `pass-${Date.now()}`;
    const newPassenger: Passenger = {
      id: newPassengerId,
      name: input.fullName,
      city: input.city,
      country: input.country || 'India',
      xHandle: input.xHandle.replace('@', ''),
      githubUrl: input.githubUrl,
      linkedinUrl: input.linkedinUrl,
      websiteUrl: input.websiteUrl,
      avatarUrl: input.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
      role: input.role,
      status: autoApprove ? 'approved' : 'pending',
      trainNumber: 'MUMBAI8',
      bio: input.bio || `Attendee at Mumbai Onchain representing ${input.city}.`,
      createdAt: new Date().toISOString(),
    };

    if (autoApprove) {
      const nextSeat = getNextSequentialSeatNumber();
      if (!nextSeat) {
        alert('Train is at full capacity (120/120 seats)!');
        return;
      }
      newPassenger.seatNumber = nextSeat.seatNumber;
      newPassenger.coachId = nextSeat.coachId;
      newPassenger.coachName = nextSeat.coachName;
      newPassenger.approvedAt = new Date().toISOString();

      setPassengers((prev) => [...prev, newPassenger]);
      setCurrentUser(newPassenger);
      setLastAssignedSeat(nextSeat.seatNumber);
      setIsBoardingPassOpen(true);
    } else {
      setPendingApplications((prev) => [newPassenger, ...prev]);
    }

    return newPassenger;
  }, [getNextSequentialSeatNumber]);

  // Admin approves application -> ATOMICALLY assigns next seat
  const approveApplication = useCallback((applicationId: string) => {
    const appToApprove = pendingApplications.find((a) => a.id === applicationId);
    if (!appToApprove) return;

    const nextSeat = getNextSequentialSeatNumber();
    if (!nextSeat) {
      alert('Cannot approve: Train is at full capacity (120/120 seats)!');
      return;
    }

    const approvedPassenger: Passenger = {
      ...appToApprove,
      status: 'approved',
      seatNumber: nextSeat.seatNumber,
      coachId: nextSeat.coachId,
      coachName: nextSeat.coachName,
      approvedAt: new Date().toISOString(),
    };

    setPendingApplications((prev) => prev.filter((a) => a.id !== applicationId));
    setPassengers((prev) => [...prev, approvedPassenger]);
    setLastAssignedSeat(nextSeat.seatNumber);

    // If it was currentUser who was pending, upgrade them
    if (currentUser?.id === applicationId) {
      setCurrentUser(approvedPassenger);
    }

    return approvedPassenger;
  }, [pendingApplications, getNextSequentialSeatNumber, currentUser]);

  // Admin rejects application
  const rejectApplication = useCallback((applicationId: string) => {
    setPendingApplications((prev) => prev.filter((a) => a.id !== applicationId));
  }, []);

  // Admin revokes registration
  const revokePassenger = useCallback((passengerId: string) => {
    setPassengers((prev) => prev.filter((p) => p.id !== passengerId));
    if (currentUser?.id === passengerId) {
      setCurrentUser(null);
    }
  }, [currentUser]);

  // Search filtered passengers and seats
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return passengers.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.xHandle.toLowerCase().includes(q) ||
        (p.seatNumber && p.seatNumber.toLowerCase().includes(q)) ||
        p.city.toLowerCase().includes(q) ||
        p.role.toLowerCase().includes(q)
    );
  }, [passengers, searchQuery]);

  // Select coach & focus seat
  const focusAndHighlightSeat = useCallback((seatNumber: string) => {
    setFocusedSeatNumber(seatNumber);
    // Find coach
    for (const coach of coaches) {
      const found = coach.seats.find((s) => s.seatNumber === seatNumber);
      if (found) {
        setSelectedCoachId(coach.id);
        setViewMode('seat-map');
        if (found.passenger) {
          setInspectedPassenger(found.passenger);
          setInspectedSeat(found);
        }
        break;
      }
    }
  }, [coaches]);

  // Reset demo
  const resetToSeed = useCallback(() => {
    setPassengers(INITIAL_APPROVED_PASSENGERS);
    setPendingApplications(INITIAL_PENDING_PASSENGERS);
    const defaultUser = INITIAL_APPROVED_PASSENGERS.find((p) => p.seatNumber === 'MUM-0042');
    setCurrentUser(defaultUser || null);
    setSelectedCoachId('C01');
    setViewMode('exterior');
    setInspectedPassenger(null);
    setInspectedSeat(null);
    setFocusedSeatNumber(null);
  }, []);

  return {
    passengers,
    pendingApplications,
    coaches,
    currentUser,
    setCurrentUser,
    selectedCoachId,
    setSelectedCoachId,
    inspectedPassenger,
    setInspectedPassenger,
    inspectedSeat,
    setInspectedSeat,
    viewMode,
    setViewMode,
    isRegisterOpen,
    setIsRegisterOpen,
    isBoardingPassOpen,
    setIsBoardingPassOpen,
    isAdminOpen,
    setIsAdminOpen,
    searchQuery,
    setSearchQuery,
    searchResults,
    focusedSeatNumber,
    setFocusedSeatNumber,
    isTransitioningScene,
    setIsTransitioningScene,
    lastAssignedSeat,
    totalCapacity,
    reservedCount,
    availableCount,
    submitApplication,
    approveApplication,
    rejectApplication,
    revokePassenger,
    focusAndHighlightSeat,
    resetToSeed,
  };
}
