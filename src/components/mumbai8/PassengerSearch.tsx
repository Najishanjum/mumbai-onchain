import React, { useState } from 'react';
import { Search, X, MapPin } from 'lucide-react';
import type { Passenger } from '../../types/mumbai8';

interface PassengerSearchProps {
  passengers: Passenger[];
  onShowSeat: (seatNumber: string) => void;
  onInspectPassenger: (passenger: Passenger) => void;
}

export const PassengerSearch: React.FC<PassengerSearchProps> = ({
  passengers,
  onShowSeat,
  onInspectPassenger,
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const results = query.trim()
    ? passengers.filter(
        (p) =>
          p.name.toLowerCase().includes(query.toLowerCase()) ||
          p.xHandle.toLowerCase().includes(query.toLowerCase()) ||
          (p.seatNumber && p.seatNumber.toLowerCase().includes(query.toLowerCase())) ||
          p.city.toLowerCase().includes(query.toLowerCase()) ||
          p.role.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  const handleSelect = (passenger: Passenger) => {
    if (passenger.seatNumber) {
      onShowSeat(passenger.seatNumber);
    }
    onInspectPassenger(passenger);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full max-w-xl">
      {/* Search Input Bar */}
      <div className="relative flex items-center">
        <Search className="absolute left-4 h-4 w-4 text-cyan-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search MUMBAI8 (e.g. Najish, @Najish_anjum, MUM-0042, Bhopal)..."
          className="w-full rounded-2xl border border-cyan-500/30 bg-[#090D18]/90 pl-11 pr-10 py-3 text-xs sm:text-sm text-white placeholder-slate-400 backdrop-blur-xl focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 shadow-lg shadow-cyan-950/40"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setIsOpen(false);
            }}
            className="absolute right-3.5 p-1 rounded-full text-slate-400 hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Live Dropdown Results */}
      {isOpen && query.trim() && (
        <div className="absolute top-full left-0 right-0 mt-2 max-h-80 overflow-y-auto rounded-2xl border border-cyan-500/40 bg-[#090D18]/95 p-2 backdrop-blur-xl shadow-2xl shadow-cyan-950/80 z-40 space-y-1">
          {results.length > 0 ? (
            results.map((passenger) => (
              <div
                key={passenger.id}
                className="group flex items-center justify-between gap-3 rounded-xl p-2.5 hover:bg-cyan-950/40 border border-transparent hover:border-cyan-500/30 transition-all"
              >
                <div
                  className="flex items-center gap-3 cursor-pointer flex-1"
                  onClick={() => handleSelect(passenger)}
                >
                  <img
                    src={passenger.avatarUrl}
                    alt={passenger.name}
                    className="h-9 w-9 rounded-full object-cover border border-cyan-400/50"
                  />
                  <div className="truncate">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white group-hover:text-cyan-300">
                        {passenger.name}
                      </span>
                      <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950 px-1.5 py-0.2 rounded border border-cyan-500/30">
                        {passenger.role}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
                      <span>@{passenger.xHandle}</span>
                      <span>&bull;</span>
                      <span className="flex items-center gap-0.5 text-slate-300">
                        <MapPin className="h-2.5 w-2.5 text-red-400" />
                        {passenger.city}
                      </span>
                    </div>
                  </div>
                </div>

                {passenger.seatNumber && (
                  <button
                    onClick={() => {
                      onShowSeat(passenger.seatNumber!);
                      setIsOpen(false);
                    }}
                    className="flex items-center gap-1.5 rounded-lg bg-cyan-500/20 border border-cyan-400/40 px-3 py-1.5 text-xs font-mono font-bold text-cyan-300 hover:bg-cyan-500 hover:text-slate-950 transition"
                  >
                    <span>{passenger.seatNumber}</span>
                    <span className="text-[10px]">&bull; SHOW SEAT</span>
                  </button>
                )}
              </div>
            ))
          ) : (
            <div className="py-6 text-center text-xs font-mono text-slate-400">
              No passengers found matching "{query}".
            </div>
          )}
        </div>
      )}
    </div>
  );
};
