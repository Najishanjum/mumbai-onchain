export type PassengerRole =
  | 'Builder'
  | 'Developer'
  | 'Founder'
  | 'Creator'
  | 'Student'
  | 'Designer'
  | 'Investor'
  | 'Community'
  | 'Other';

export type PassengerStatus = 'pending' | 'approved' | 'rejected';

export type SeatStatus = 'available' | 'reserved' | 'selected' | 'you' | 'boarding';

export interface Passenger {
  id: string;
  name: string;
  city: string;
  country: string;
  xHandle: string;
  githubUrl?: string;
  linkedinUrl?: string;
  websiteUrl?: string;
  avatarUrl: string;
  role: PassengerRole;
  status: PassengerStatus;
  seatId?: string;
  seatNumber?: string; // e.g., 'MUM-0042'
  coachId?: string; // 'C01' .. 'C06'
  coachName?: string;
  trainNumber: string; // 'MUMBAI8'
  bio?: string;
  createdAt: string;
  approvedAt?: string;
}

export interface Seat {
  id: string;
  seatNumber: string; // 'MUM-0001' to 'MUM-0120'
  seatIndex: number; // 1 to 120
  coachId: string; // 'C01' to 'C06'
  coachName: string;
  row: number; // 1 to 5
  col: number; // 1 to 4 (1-2 Left Window/Aisle, 3-4 Right Aisle/Window)
  side: 'left' | 'right';
  position: 'window' | 'aisle';
  status: SeatStatus;
  passengerId?: string;
  passenger?: Passenger;
}

export interface Coach {
  id: string; // 'C01'
  coachNumber: string; // 'COACH C01'
  name: string; // 'BUILDERS', 'DEVELOPERS', etc.
  subtitle: string;
  capacity: number; // 20
  seats: Seat[];
}

export interface TrainInfo {
  trainNumber: string; // 'MUMBAI8'
  name: string; // 'THE ONCHAIN EXPRESS'
  tagline: string; // 'Your seat. Your city. Your network.'
  route: string; // 'MUMBAI → ONCHAIN'
  totalCapacity: number; // 120
  reservedCount: number;
  availableCount: number;
}

export interface RegistrationInput {
  fullName: string;
  city: string;
  country: string;
  xHandle: string;
  githubUrl?: string;
  linkedinUrl?: string;
  websiteUrl?: string;
  avatarUrl?: string;
  role: PassengerRole;
  bio?: string;
}

export interface SearchResult {
  passenger: Passenger;
  seatNumber: string;
  coachId: string;
  coachName: string;
}
