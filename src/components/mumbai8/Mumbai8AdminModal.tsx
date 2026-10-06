import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck, Check, Trash2, RefreshCw, Search } from 'lucide-react';
import type { Passenger } from '../../types/mumbai8';

interface Mumbai8AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  passengers: Passenger[];
  pendingApplications: Passenger[];
  totalCapacity: number;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onRevoke: (id: string) => void;
  onResetToSeed: () => void;
}

export const Mumbai8AdminModal: React.FC<Mumbai8AdminModalProps> = ({
  isOpen,
  onClose,
  passengers,
  pendingApplications,
  totalCapacity,
  onApprove,
  onReject,
  onRevoke,
  onResetToSeed,
}) => {
  const [activeTab, setActiveTab] = useState<'pending' | 'approved'>('pending');
  const [searchFilter, setSearchFilter] = useState('');

  if (!isOpen) return null;

  const reservedCount = passengers.length;
  const availableCount = Math.max(0, totalCapacity - reservedCount);

  const filteredApproved = passengers.filter(
    (p) =>
      p.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      p.city.toLowerCase().includes(searchFilter.toLowerCase()) ||
      (p.seatNumber && p.seatNumber.toLowerCase().includes(searchFilter.toLowerCase())) ||
      p.role.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
        <div className="absolute inset-0" onClick={onClose} />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-4xl overflow-hidden rounded-3xl border border-purple-500/40 bg-[#090D18] p-6 sm:p-8 shadow-2xl shadow-purple-950/80 z-10 my-auto"
        >
          {/* Top Line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-cyan-400 to-teal-400" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 rounded-full border border-white/10 bg-white/5 p-2 text-slate-400 hover:text-white transition"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5 mb-6">
            <div>
              <div className="flex items-center gap-2 text-purple-400 text-xs font-mono uppercase tracking-widest">
                <ShieldCheck className="h-4 w-4" />
                <span>MUMBAI8 CONDUCTOR & ADMIN PANEL</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase mt-0.5">
                MUMBAI8 PASSENGER ADMIN
              </h2>
            </div>

            <button
              onClick={() => {
                if (confirm('Reset to initial seed (48 passengers, 3 pending)?')) {
                  onResetToSeed();
                }
              }}
              className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-mono text-slate-300 hover:border-red-500/40 hover:text-red-400 transition"
              title="Reset Demo Data"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>RESET SEED</span>
            </button>
          </div>

          {/* High-level Metric Stat Blocks */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3.5 text-center">
              <span className="text-[10px] font-mono text-slate-400 uppercase">Total Seats</span>
              <p className="text-xl font-mono font-bold text-white mt-1">{totalCapacity}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3.5 text-center">
              <span className="text-[10px] font-mono text-slate-400 uppercase">Reserved</span>
              <p className="text-xl font-mono font-bold text-cyan-400 mt-1">{reservedCount}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3.5 text-center">
              <span className="text-[10px] font-mono text-slate-400 uppercase">Available</span>
              <p className="text-xl font-mono font-bold text-emerald-400 mt-1">{availableCount}</p>
            </div>
            <div className="rounded-2xl border border-purple-500/30 bg-purple-950/20 p-3.5 text-center">
              <span className="text-[10px] font-mono text-purple-300 uppercase">Pending Review</span>
              <p className="text-xl font-mono font-bold text-purple-400 mt-1">{pendingApplications.length}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3.5 text-center col-span-2 sm:col-span-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase">Approved</span>
              <p className="text-xl font-mono font-bold text-teal-300 mt-1">{reservedCount}</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-2 border-b border-white/10 pb-3 mb-4">
            <button
              onClick={() => setActiveTab('pending')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold transition ${
                activeTab === 'pending'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-400/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>PENDING APPLICATIONS ({pendingApplications.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('approved')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold transition ${
                activeTab === 'approved'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>CONFIRMED PASSENGERS ({passengers.length})</span>
            </button>
          </div>

          {/* Tab Content: Pending Review Queue */}
          {activeTab === 'pending' && (
            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
              {pendingApplications.length > 0 ? (
                pendingApplications.map((app) => (
                  <div
                    key={app.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl border border-purple-500/20 bg-purple-950/10 hover:border-purple-500/40 transition"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={app.avatarUrl}
                        alt={app.name}
                        className="h-11 w-11 rounded-xl object-cover border border-purple-400/40"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white">{app.name}</h4>
                          <span className="text-[10px] font-mono text-purple-300 bg-purple-950 px-2 py-0.5 rounded border border-purple-400/30">
                            {app.role}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-mono text-slate-400 mt-0.5">
                          <span>@{app.xHandle}</span>
                          <span>&bull;</span>
                          <span>{app.city}, {app.country}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => onApprove(app.id)}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 px-4 py-2 text-xs font-bold text-slate-950 shadow-md shadow-emerald-500/20 hover:scale-105 transition"
                      >
                        <Check className="h-3.5 w-3.5" />
                        <span>APPROVE & ASSIGN SEAT</span>
                      </button>
                      <button
                        onClick={() => onReject(app.id)}
                        className="p-2 rounded-xl border border-white/10 bg-white/5 hover:border-red-500/40 hover:text-red-400 text-slate-400 transition"
                        title="Reject application"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-xs font-mono text-slate-400">
                  No pending registration applications in queue.
                </div>
              )}
            </div>
          )}

          {/* Tab Content: Approved Manifest */}
          {activeTab === 'approved' && (
            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
              <div className="relative">
                <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Filter confirmed passengers by name, seat number, or city..."
                  className="w-full rounded-xl border border-white/10 bg-black/40 pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                {filteredApproved.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-xl border border-white/5 bg-white/[0.02] hover:border-white/15 transition"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={p.avatarUrl}
                        alt={p.name}
                        className="h-8 w-8 rounded-lg object-cover border border-cyan-400/40"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">{p.name}</span>
                          <span className="font-mono font-bold text-cyan-300 text-xs">
                            {p.seatNumber}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            ({p.coachId})
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-slate-400">
                          @{p.xHandle} &bull; {p.city} &bull; {p.role}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => onRevoke(p.id)}
                      className="p-1.5 rounded-lg border border-transparent hover:border-red-500/40 hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition"
                      title="Revoke Registration"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
