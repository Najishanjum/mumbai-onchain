import React from 'react';
import type { FilterState } from '../types/event';
import { Search } from 'lucide-react';

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
    'DeFi',
    'Security',
    'Privacy',
    'Hackathon',
    'Networking',
    'Governance',
  ];

  const dates = [
    { label: 'ALL DAYS', value: 'ALL' },
    { label: '01 NOV', value: '2026-11-01' },
    { label: '02 NOV', value: '2026-11-02' },
    { label: '03 NOV', value: '2026-11-03' },
    { label: '04 NOV', value: '2026-11-04' },
    { label: '05 NOV', value: '2026-11-05' },
    { label: '06 NOV', value: '2026-11-06' },
    { label: '07 NOV', value: '2026-11-07' },
    { label: '08 NOV', value: '2026-11-08' },
  ];

  const statuses = [
    'ALL',
    'VOLUNTEER',
    'ATTENDING',
    'INTERESTED',
    'PENDING',
    'COMPLETED',
  ];

  return (
    <div className="w-full bg-[#FFFFFF] border border-[#000000] p-4 sm:p-6 space-y-5 select-none">
      
      {/* Top Search Bar & Counter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-[#D8D8D8] pb-4">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#555555]" />
          <input
            type="text"
            placeholder="SEARCH BY TITLE, VENUE, ORGANIZER..."
            value={filters.searchQuery}
            onChange={(e) => onFilterChange({ ...filters, searchQuery: e.target.value })}
            className="w-full bg-[#FAFAFA] border border-[#D8D8D8] focus:border-[#000000] text-[#050505] pl-9 pr-4 py-2 font-mono text-xs focus:outline-none placeholder:text-[#888888]"
          />
        </div>

        <div className="flex items-center gap-3 justify-between sm:justify-end">
          <span className="font-mono text-xs text-[#555555]">
            CATALOGUE RESULTS: <strong className="text-[#000000] font-pixel text-[13px]">{totalResults}</strong>
          </span>

          {(filters.category !== 'ALL' || filters.date !== 'ALL' || filters.status !== 'ALL' || filters.searchQuery) && (
            <button
              onClick={() => onFilterChange({ category: 'ALL', date: 'ALL', status: 'ALL', searchQuery: '' })}
              className="font-mono text-[11px] underline text-[#000000] hover:text-[#555555] font-semibold"
            >
              RESET FILTERS [×]
            </button>
          )}
        </div>
      </div>

      {/* Date Filter Row */}
      <div className="space-y-2">
        <span className="font-mono text-[10px] text-[#666666] uppercase tracking-widest block font-bold">
          DATE SELECTOR:
        </span>
        <div className="flex flex-wrap gap-1.5">
          {dates.map((d) => {
            const isActive = filters.date === d.value;
            return (
              <button
                key={d.value}
                onClick={() => onFilterChange({ ...filters, date: d.value })}
                className={`px-3 py-1.5 font-mono text-xs transition-all duration-100 border ${
                  isActive
                    ? 'bg-[#000000] text-[#FFFFFF] border-[#000000] font-bold shadow-xs'
                    : 'bg-[#FFFFFF] text-[#050505] border-[#D8D8D8] hover:border-[#000000]'
                }`}
              >
                {d.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Category Filter Row */}
      <div className="space-y-2">
        <span className="font-mono text-[10px] text-[#666666] uppercase tracking-widest block font-bold">
          ECOSYSTEM TRACK:
        </span>
        <div className="flex flex-wrap gap-1.5">
          {categories.map((cat) => {
            const isActive = filters.category === cat;
            return (
              <button
                key={cat}
                onClick={() => onFilterChange({ ...filters, category: cat })}
                className={`px-3 py-1.5 font-mono text-xs transition-all duration-100 border ${
                  isActive
                    ? 'bg-[#000000] text-[#FFFFFF] border-[#000000] font-bold shadow-xs'
                    : 'bg-[#FFFFFF] text-[#050505] border-[#D8D8D8] hover:border-[#000000]'
                }`}
              >
                {cat.toUpperCase()}
              </button>
            );
          })}
        </div>
      </div>

      {/* Status Filter Row */}
      <div className="space-y-2 pt-1 border-t border-[#EAEAEA]">
        <span className="font-mono text-[10px] text-[#666666] uppercase tracking-widest block font-bold">
          ATTENDANCE STATUS:
        </span>
        <div className="flex flex-wrap gap-1.5">
          {statuses.map((st) => {
            const isActive = filters.status === st;
            return (
              <button
                key={st}
                onClick={() => onFilterChange({ ...filters, status: st })}
                className={`px-2.5 py-1 font-mono text-[11px] transition-all duration-100 border ${
                  isActive
                    ? 'bg-[#000000] text-[#FFFFFF] border-[#000000] font-bold'
                    : 'bg-[#FFFFFF] text-[#555555] border-[#D8D8D8] hover:border-[#000000] hover:text-[#000000]'
                }`}
              >
                {st}
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
};
