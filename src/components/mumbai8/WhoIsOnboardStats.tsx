import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Sparkles, Building } from 'lucide-react';
import type { Passenger } from '../../types/mumbai8';

interface WhoIsOnboardStatsProps {
  passengers: Passenger[];
  totalCapacity: number;
  onSelectCity?: (city: string) => void;
}

export const WhoIsOnboardStats: React.FC<WhoIsOnboardStatsProps> = ({
  passengers,
  totalCapacity,
  onSelectCity,
}) => {
  // Aggregate Role counts
  const roleCounts: Record<string, number> = {};
  // Aggregate City counts
  const cityCounts: Record<string, number> = {};

  passengers.forEach((p) => {
    roleCounts[p.role] = (roleCounts[p.role] || 0) + 1;
    cityCounts[p.city] = (cityCounts[p.city] || 0) + 1;
  });

  const sortedCities = Object.entries(cityCounts).sort((a, b) => b[1] - a[1]);
  const sortedRoles = Object.entries(roleCounts).sort((a, b) => b[1] - a[1]);

  return (
    <div className="w-full space-y-8">
      {/* Top Banner */}
      <div className="rounded-3xl border border-cyan-500/20 bg-gradient-to-b from-[#0B0F1C]/90 to-[#050811]/90 p-6 sm:p-8 backdrop-blur-xl">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5 mb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 uppercase tracking-widest">
              <Sparkles className="h-3.5 w-3.5" />
              <span>LIVE ONBOARD MANIFEST METRICS</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase mt-1">
              WHO'S ON MUMBAI8?
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <span className="font-mono text-2xl sm:text-3xl font-bold text-cyan-300">
              {String(passengers.length).padStart(3, '0')}
            </span>
            <span className="font-mono text-sm text-slate-400">/ {totalCapacity} ONBOARD</span>
          </div>
        </div>

        {/* Roles Distribution Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {sortedRoles.map(([role, count]) => {
            const rolePercentage = Math.round((count / passengers.length) * 100) || 0;
            return (
              <div
                key={role}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-2"
              >
                <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                  <span className="uppercase">{role}</span>
                  <span className="text-cyan-400 font-bold">{count}</span>
                </div>
                <div className="text-xl font-bold text-white font-mono">
                  {rolePercentage}%
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                  <motion.div
                    className="h-full bg-gradient-to-r from-cyan-400 to-teal-300"
                    initial={{ width: 0 }}
                    animate={{ width: `${rolePercentage}%` }}
                    transition={{ duration: 0.8 }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* City Network Hubs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Top Cities Manifest */}
        <div className="lg:col-span-7 rounded-3xl border border-cyan-500/20 bg-gradient-to-b from-[#0B0F1C]/90 to-[#050811]/90 p-6 sm:p-8 backdrop-blur-xl space-y-5">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-red-400" />
              <h3 className="font-sans text-lg font-bold text-white uppercase">
                PASSENGERS BY CITY
              </h3>
            </div>
            <span className="font-mono text-xs text-slate-400">
              {sortedCities.length} ACTIVE HUBS
            </span>
          </div>

          <div className="space-y-3">
            {sortedCities.slice(0, 8).map(([city, count], idx) => {
              const maxCount = sortedCities[0]?.[1] || 1;
              const barWidth = Math.round((count / maxCount) * 100);

              return (
                <button
                  key={city}
                  onClick={() => onSelectCity?.(city)}
                  className="group w-full flex items-center justify-between gap-4 p-3 rounded-xl border border-white/5 bg-white/[0.02] hover:border-cyan-400/40 hover:bg-cyan-950/20 transition-all text-left"
                >
                  <div className="flex items-center gap-3 w-40 truncate">
                    <span className="font-mono text-xs font-bold text-slate-500 w-5">
                      #{idx + 1}
                    </span>
                    <span className="text-sm font-semibold text-white group-hover:text-cyan-300 transition-colors">
                      {city}
                    </span>
                  </div>

                  {/* Progress visual */}
                  <div className="flex-1 hidden sm:block h-2 bg-slate-900 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-400 to-teal-400 rounded-full"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>

                  <div className="font-mono text-xs font-bold text-cyan-300">
                    {count} {count === 1 ? 'passenger' : 'passengers'}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* India Network Map Info Card */}
        <div className="lg:col-span-5 rounded-3xl border border-cyan-500/20 bg-gradient-to-b from-[#090D18]/90 to-[#04060C]/90 p-6 sm:p-8 backdrop-blur-xl flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 uppercase tracking-widest mb-1">
              <Building className="h-3.5 w-3.5" />
              <span>TRANSIT CORRIDOR</span>
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight uppercase">
              ALL ROADS LEAD TO MUMBAI
            </h3>
            <p className="text-xs text-slate-300 font-light mt-2 leading-relaxed">
              Engineers, founders, and researchers from across India and the global Ethereum ecosystem are convening at Devcon 8 Mumbai.
            </p>
          </div>

          {/* Connected Hubs Grid */}
          <div className="rounded-2xl border border-white/10 bg-black/40 p-4 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between text-slate-400">
              <span>TERMINAL DESTINATION:</span>
              <strong className="text-white">MUMBAI (BKC / JIO)</strong>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>ACTIVE REGIONS:</span>
              <strong className="text-cyan-300">INDIA &bull; EU &bull; SEA</strong>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>TOTAL CAPACITY:</span>
              <strong className="text-emerald-400">{totalCapacity} SEATS</strong>
            </div>
          </div>

          <div className="text-[11px] font-mono text-slate-500">
            * Live network synchronized via Mumbai Onchain decentralized passenger register.
          </div>
        </div>
      </div>
    </div>
  );
};
