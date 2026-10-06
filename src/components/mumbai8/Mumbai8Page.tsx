import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrainHero } from './TrainHero';
import { TrainExteriorScene } from './TrainExteriorScene';
import { TrainInteriorScene } from './TrainInteriorScene';
import { CoachSelector } from './CoachSelector';
import { SeatMap } from './SeatMap';
import { PassengerCardModal } from './PassengerCardModal';
import { RegistrationModal } from './RegistrationModal';
import { BoardingPassModal } from './BoardingPassModal';
import { WhoIsOnboardStats } from './WhoIsOnboardStats';
import { PassengerSearch } from './PassengerSearch';
import { Mumbai8AdminModal } from './Mumbai8AdminModal';
import { useMumbai8Store } from '../../lib/useMumbai8Store';
import type { Passenger, Seat } from '../../types/mumbai8';

interface Mumbai8PageProps {
  onNavigateToPeople?: (passenger: Passenger) => void;
}

export const Mumbai8Page: React.FC<Mumbai8PageProps> = ({ onNavigateToPeople }) => {
  const {
    passengers,
    pendingApplications,
    coaches,
    currentUser,
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
    focusedSeatNumber,
    totalCapacity,
    reservedCount,
    availableCount,
    submitApplication,
    approveApplication,
    rejectApplication,
    revokePassenger,
    focusAndHighlightSeat,
    resetToSeed,
  } = useMumbai8Store();

  const currentCoach = coaches.find((c) => c.id === selectedCoachId) || coaches[0];

  const handleSeatClick = (seat: Seat) => {
    setInspectedSeat(seat);
    if (seat.passenger) {
      setInspectedPassenger(seat.passenger);
    } else {
      // Seat is open -> open registration
      setIsRegisterOpen(true);
    }
  };

  const handleGoToMySeat = (seatNumber: string) => {
    focusAndHighlightSeat(seatNumber);
  };

  return (
    <div className="min-h-screen bg-[#04060B] text-slate-100 pb-24 selection:bg-cyan-500 selection:text-black">
      {/* Background ambient gradient lighting */}
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-950/20 via-[#05070E] to-[#030408] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10 space-y-8">
        {/* 1. Hero Section */}
        <TrainHero
          totalCapacity={totalCapacity}
          reservedCount={reservedCount}
          availableCount={availableCount}
          currentUser={currentUser}
          onBoardClick={() => {
            if (currentUser?.seatNumber) {
              setIsBoardingPassOpen(true);
            } else {
              setIsRegisterOpen(true);
            }
          }}
          onViewPassengersClick={() => setViewMode('stats')}
          onOpenMySeat={() => {
            if (currentUser?.seatNumber) {
              setIsBoardingPassOpen(true);
            } else {
              setIsRegisterOpen(true);
            }
          }}
          onOpenAdmin={() => setIsAdminOpen(true)}
          activeView={viewMode}
          onViewChange={setViewMode}
        />

        {/* 2. Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <PassengerSearch
            passengers={passengers}
            onShowSeat={focusAndHighlightSeat}
            onInspectPassenger={setInspectedPassenger}
          />

          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-slate-400">VIEW MODE:</span>
            <div className="flex rounded-xl border border-white/10 bg-white/5 p-1">
              <button
                onClick={() => setViewMode('exterior')}
                className={`px-3 py-1 rounded-lg transition ${
                  viewMode === 'exterior' ? 'bg-cyan-500/30 text-cyan-300 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                3D Exterior
              </button>
              <button
                onClick={() => setViewMode('interior')}
                className={`px-3 py-1 rounded-lg transition ${
                  viewMode === 'interior' ? 'bg-cyan-500/30 text-cyan-300 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Interior
              </button>
              <button
                onClick={() => setViewMode('seat-map')}
                className={`px-3 py-1 rounded-lg transition ${
                  viewMode === 'seat-map' ? 'bg-cyan-500/30 text-cyan-300 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Seat Map
              </button>
              <button
                onClick={() => setViewMode('stats')}
                className={`px-3 py-1 rounded-lg transition ${
                  viewMode === 'stats' ? 'bg-cyan-500/30 text-cyan-300 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Network
              </button>
            </div>
          </div>
        </div>

        {/* 3. Primary Interactive Scene Switcher */}
        <AnimatePresence mode="wait">
          {viewMode === 'exterior' && (
            <motion.div
              key="exterior"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
            >
              <TrainExteriorScene
                onEnterTrain={() => setViewMode('interior')}
                onSelectCoach={(cId) => {
                  setSelectedCoachId(cId);
                  setViewMode('seat-map');
                }}
                onViewSeatMap={() => setViewMode('seat-map')}
              />
            </motion.div>
          )}

          {viewMode === 'interior' && (
            <motion.div
              key="interior"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
            >
              <TrainInteriorScene
                currentCoach={currentCoach}
                currentUser={currentUser}
                onSelectCoach={setSelectedCoachId}
                onViewSeatMap={() => setViewMode('seat-map')}
                onViewExterior={() => setViewMode('exterior')}
                onInspectPassenger={setInspectedPassenger}
                onInspectSeat={handleSeatClick}
              />
            </motion.div>
          )}

          {viewMode === 'seat-map' && (
            <motion.div
              key="seat-map"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
              className="space-y-6"
            >
              <CoachSelector
                coaches={coaches}
                selectedCoachId={selectedCoachId}
                currentUser={currentUser}
                onSelectCoach={setSelectedCoachId}
              />

              <SeatMap
                coach={currentCoach}
                currentUser={currentUser}
                focusedSeatNumber={focusedSeatNumber}
                onSeatClick={handleSeatClick}
                onRegisterClick={() => setIsRegisterOpen(true)}
              />
            </motion.div>
          )}

          {viewMode === 'stats' && (
            <motion.div
              key="stats"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
            >
              <WhoIsOnboardStats
                passengers={passengers}
                totalCapacity={totalCapacity}
                onSelectCity={(city) => {
                  const pInCity = passengers.find((p) => p.city.toLowerCase() === city.toLowerCase());
                  if (pInCity?.seatNumber) {
                    focusAndHighlightSeat(pInCity.seatNumber);
                  }
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 4. Interactive Modals */}
      <PassengerCardModal
        passenger={inspectedPassenger}
        seat={inspectedSeat}
        isOpen={!!inspectedPassenger}
        onClose={() => {
          setInspectedPassenger(null);
          setInspectedSeat(null);
        }}
        onViewPeopleProfile={onNavigateToPeople}
      />

      <RegistrationModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onSubmit={(input, autoApprove) => {
          submitApplication(input, autoApprove);
        }}
      />

      <BoardingPassModal
        passenger={currentUser}
        isOpen={isBoardingPassOpen}
        onClose={() => setIsBoardingPassOpen(false)}
        onGoToSeat={handleGoToMySeat}
      />

      <Mumbai8AdminModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        passengers={passengers}
        pendingApplications={pendingApplications}
        totalCapacity={totalCapacity}
        onApprove={approveApplication}
        onReject={rejectApplication}
        onRevoke={revokePassenger}
        onResetToSeed={resetToSeed}
      />
    </div>
  );
};
