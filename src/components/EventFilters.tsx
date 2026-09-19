import React from 'react';
import type { FilterState } from '../types/event';
import { Search, Filter, Calendar as CalendarIcon, Tag } from 'lucide-react';

interface EventFiltersProps {
  filters: FilterState;
  onFilterChange: (newFilters: FilterState) => void;
  totalResults: number;
}

export const EventFilters: React.FC<EventFiltersProps> = ({
  filters,
  onFilterChange,
  totalResults,
}) => {
  const categories = [
    'ALL',
    'Devcon',
    'Ecosystem',
    'Ethereum',
    'Solana',
    'Privacy',
    'Security',
    'DeFi',
    'Hackathon',
    'Networking',
    'Governance',
  ];

  const dates = [
    'ALL',
    '2026-11-01',
    '2026-11-02',
    '2026-11-03',
    '2026-11-04',
    '2026-11-05',
    '2026-11-06',
    '2026-11-07',
    '2026-11-08',
  ];

  const statuses = [
    'ALL',
    'VOLUNTEER',
    'ATTENDING',
    'INTERESTED',
    'PENDING',
    'PENDING APPROVAL',
    'COMPLETED',
  ];

  return (
    <div className="w-full bg-[#0A0A0A] border border-[#202020] rounded-2xl p-4 sm:p-5 space-y-4 shadow-card">
      
      {/* Top Search Bar & Result Count */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search events, venues, organizers..."
            value={filters.searchQuery}
            onChange={(e) => onFilterChange({ ...filters, searchQuery: e.target.value })}
            className="w-full bg-[#121212] border border-[#252525] focus:border-[#627EEA] rounded-xl pl-9 pr-4 py-2 text-xs font-mono text-white placeholder-zinc-500 outline-none transition-colors"
          />
        </div>

        <div className="font-mono text-xs text-zinc-400 flex items-center gap-2">
          <span>FILTERED RESULTS:</span>
          <span className="font-bold text-[#627EEA] bg-[#627EEA]/10 px-2 py-0.5 rounded border border-[#627EEA]/30">
            {totalResults} EVENTS
          </span>
        </div>
      </div>

      {/* Date Filter Row */}
      <div className="space-y-1.5">
        <div className="font-mono text-[11px] text-zinc-500 uppercase tracking-widest flex items-center gap-1">
          <CalendarIcon className="w-3 h-3 text-[#627EEA]" /> DATE FILTER (NOV 1–8)
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {dates.map((d) => {
            const label = d === 'ALL' ? 'ALL DATES' : `NOV ${d.slice(8)}`;
            const isSelected = filters.date === d;
            return (
              <button
                key={d}
                onClick={() => onFilterChange({ ...filters, date: d })}
                className={`px-3 py-1 rounded-lg font-mono text-xs whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-[#627EEA] text-white font-bold shadow-glow-eth'
                    : 'bg-[#121212] text-zinc-400 hover:text-white border border-[#222]'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Category & Status Filter Pills */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-[#1A1A1A]">
        
        {/* Categories */}
        <div className="space-y-1.5">
          <div className="font-mono text-[11px] text-zinc-500 uppercase tracking-widest flex items-center gap-1">
            <Tag className="w-3 h-3 text-[#8B5CF6]" /> CATEGORY
          </div>
          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat) => {
              const isSelected = filters.category === cat;
              return (
                <button
                  key={cat}
                  onClick={() => onFilterChange({ ...filters, category: cat })}
                  className={`px-2.5 py-1 rounded-md font-mono text-[11px] transition-all ${
                    isSelected
                      ? 'bg-[#8B5CF6] text-white font-bold'
                      : 'bg-[#141414] text-zinc-400 hover:text-white border border-[#222]'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Attendance Status */}
        <div className="space-y-1.5">
          <div className="font-mono text-[11px] text-zinc-500 uppercase tracking-widest flex items-center gap-1">
            <Filter className="w-3 h-3 text-[#22C55E]" /> ATTENDANCE STATUS
          </div>
          <div className="flex flex-wrap gap-1.5">
            {statuses.map((st) => {
              const isSelected = filters.status === st;
              return (
                <button
                  key={st}
                  onClick={() => onFilterChange({ ...filters, status: st })}
                  className={`px-2.5 py-1 rounded-md font-mono text-[11px] transition-all ${
                    isSelected
                      ? 'bg-[#22C55E] text-black font-bold'
                      : 'bg-[#141414] text-zinc-400 hover:text-white border border-[#222]'
                  }`}
                >
                  {st}
                </button>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
};
