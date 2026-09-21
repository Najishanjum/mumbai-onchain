import React from 'react';
import { usePeopleStore } from '../lib/usePeopleStore';
import type { EventItem } from '../types/event';
import type { PersonCategory } from '../types/person';
import { PersonCard } from './PersonCard';
import { PersonAvatar } from './PersonAvatar';
import {
  Search,
  UserPlus,
  Users,
  UserCheck,
  Clock,
  X,
  Sparkles,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

interface PeopleDirectoryProps {
  events: EventItem[];
  onSelectEvent?: (eventId: string) => void;
}

const CATEGORY_TABS: Array<'ALL' | PersonCategory> = [
  'ALL',
  'Builder',
  'Founder',
  'Volunteer',
  'Student',
  'Attendee',
  'Other',
];

export const PeopleDirectory: React.FC<PeopleDirectoryProps> = ({
  events,
}) => {
  const {
    myProfile,
    filters,
    filteredPeople,
    stats,
    isSyncing,
    refreshProfiles,
    setSelectedPersonId,
    setIsEditModalOpen,
    setFilters,
    cycleConnection,
    getConnectionStatus,
  } = usePeopleStore();

  // Helper to resolve event name
  const getEventTitleById = (id: string): string => {
    const found = events.find(e => e.id === id);
    return found ? found.title : id;
  };

  return (
    <div className="space-y-8 select-none">
      
      {/* Top Banner / Hero Header */}
      <div className="bg-[#FFFFFF] border-2 border-[#000000] p-6 sm:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[#EAEAEA] pb-6">
          <div className="space-y-1.5">
            <div className="font-mono text-xs uppercase tracking-widest flex items-center gap-2 flex-wrap">
              <span className="text-[#666666]">COMMUNITY DIRECTORY // 01—08 NOV 2026</span>
              <span className="text-[#CCCCCC]">•</span>
              <span className="inline-flex items-center gap-1.5 bg-[#F0FDF4] border border-[#BBF7D0] px-2.5 py-0.5 text-[#15803D] font-bold">
                <span className="w-2 h-2 bg-[#22C55E] rounded-full inline-block animate-pulse" />
                <span>COMMUNITY LIVE</span>
                {isSyncing && <RefreshCw className="w-3 h-3 animate-spin text-[#15803D]" />}
              </span>
            </div>
            <h1 className="font-heading font-black text-3xl sm:text-5xl text-[#050505] uppercase tracking-tight">
              PEOPLE & CONNECT
            </h1>
            <p className="font-mono text-xs text-[#555555] max-w-2xl">
              Connect with developers, founders, volunteers, and researchers across Devcon 8, India Blockchain Week, and side events. Create your profile to share it with everyone worldwide.
            </p>
          </div>

          {/* Create or Edit Profile Action Button */}
          <div className="shrink-0 flex items-center gap-3">
            {myProfile ? (
              <div
                onClick={() => setIsEditModalOpen(true)}
                className="cursor-pointer border-2 border-[#000000] p-2 bg-[#FAFAFA] hover:bg-[#F0F0F0] flex items-center gap-3 transition-colors shadow-sm"
                title="Edit your profile"
              >
                <PersonAvatar
                  name={myProfile.name}
                  avatarUrl={myProfile.avatar}
                  size="sm"
                />
                <div className="font-mono text-xs pr-2">
                  <div className="font-black text-[#000000] truncate max-w-[120px] sm:max-w-[150px]">
                    {myProfile.name}
                  </div>
                  <div className="text-[10px] text-[#666666] flex items-center gap-1">
                    <span>{myProfile.category}</span>
                    <span>•</span>
                    <span className="font-bold underline">EDIT</span>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="inline-flex items-center gap-2 bg-[#000000] hover:bg-[#222222] text-[#FFFFFF] px-5 py-3 font-heading font-black text-xs sm:text-sm tracking-wide transition-all active:scale-95 shadow-md group"
              >
                <UserPlus className="w-4 h-4 text-[#FFFFFF]" />
                <span>CREATE YOUR PROFILE</span>
              </button>
            )}
          </div>
        </div>

        {/* Live Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
          <div className="p-3 bg-[#FAFAFA] border border-[#E5E5E5] space-y-0.5">
            <div className="text-[10px] text-[#777777] uppercase font-bold flex items-center gap-1">
              <Users className="w-3 h-3 text-[#000000]" />
              <span>COMMUNITY MEMBERS</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-[#000000]">
              {stats.total}
            </div>
          </div>

          <div className="p-3 bg-[#F0FDF4] border border-[#BBF7D0] space-y-0.5">
            <div className="text-[10px] text-[#166534] uppercase font-bold flex items-center gap-1">
              <UserCheck className="w-3 h-3 text-[#166534]" />
              <span>MY CONNECTIONS</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-[#166534]">
              {stats.connectedCount}
            </div>
          </div>

          <div className="p-3 bg-[#FFFBEB] border border-[#FDE68A] space-y-0.5">
            <div className="text-[10px] text-[#B45309] uppercase font-bold flex items-center gap-1">
              <Clock className="w-3 h-3 text-[#B45309]" />
              <span>REQUESTS SENT</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-[#B45309]">
              {stats.requestedCount}
            </div>
          </div>

          <div className="p-3 bg-[#EFF6FF] border border-[#BFDBFE] space-y-0.5">
            <div className="text-[10px] text-[#1D4ED8] uppercase font-bold flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#1D4ED8]" />
              <span>BUILDERS & FOUNDERS</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-[#1D4ED8]">
              {stats.buildersCount + (stats.total - stats.buildersCount - stats.volunteersCount - stats.studentsCount)}
            </div>
          </div>
        </div>

        {/* Live sync indicator */}
        <div className="flex items-center justify-between text-[11px] font-mono text-[#15803D] bg-[#F0FDF4] border border-[#BBF7D0] px-3 py-1.5">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 bg-[#22C55E] rounded-full inline-block animate-pulse" />
            <span>GLOBAL DIRECTORY // SYNCS AUTOMATICALLY ACROSS ALL DEVICES</span>
          </span>
          <button
            type="button"
            onClick={() => refreshProfiles()}
            className="underline font-bold hover:text-[#166534] flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-[#FFFFFF] border border-[#000000] p-4 sm:p-6 space-y-4">
        
        {/* Row 1: Search + Connection Status Tabs */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#888888] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={filters.searchQuery}
              onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
              placeholder="Search people by name, city (e.g. Mumbai, Bengaluru, Berlin) or bio..."
              className="w-full pl-9 pr-8 py-2.5 bg-[#FAFAFA] border border-[#D8D8D8] focus:border-[#000000] font-mono text-xs focus:outline-none focus:bg-[#FFFFFF] transition-colors"
            />
            {filters.searchQuery && (
              <button
                onClick={() => setFilters(prev => ({ ...prev, searchQuery: '' }))}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#888888] hover:text-[#000000]"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Connection Filter Tabs */}
          <div className="flex items-center gap-1 font-mono text-xs border border-[#D8D8D8] p-1 bg-[#FAFAFA] shrink-0">
            <button
              onClick={() => setFilters(prev => ({ ...prev, connectionStatus: 'ALL' }))}
              className={`px-3 py-1.5 font-bold transition-colors ${
                filters.connectionStatus === 'ALL'
                  ? 'bg-[#000000] text-[#FFFFFF]'
                  : 'text-[#666666] hover:text-[#000000]'
              }`}
            >
              ALL PEOPLE
            </button>
            <button
              onClick={() => setFilters(prev => ({ ...prev, connectionStatus: 'CONNECTED' }))}
              className={`px-3 py-1.5 font-bold transition-colors flex items-center gap-1.5 ${
                filters.connectionStatus === 'CONNECTED'
                  ? 'bg-[#15803D] text-[#FFFFFF]'
                  : 'text-[#666666] hover:text-[#15803D]'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>CONNECTED ({stats.connectedCount})</span>
            </button>
            <button
              onClick={() => setFilters(prev => ({ ...prev, connectionStatus: 'REQUESTED' }))}
              className={`px-3 py-1.5 font-bold transition-colors flex items-center gap-1.5 ${
                filters.connectionStatus === 'REQUESTED'
                  ? 'bg-[#D97706] text-[#FFFFFF]'
                  : 'text-[#666666] hover:text-[#D97706]'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>REQUESTED ({stats.requestedCount})</span>
            </button>
          </div>

        </div>

        {/* Row 2: Category Pills + Event Filter Dropdown */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-t border-[#EAEAEA] pt-4">
          
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar font-mono text-xs">
            <span className="text-[11px] text-[#888888] uppercase font-bold mr-1 shrink-0">ROLE:</span>
            {CATEGORY_TABS.map(cat => (
              <button
                key={cat}
                onClick={() => setFilters(prev => ({ ...prev, category: cat }))}
                className={`px-3 py-1 border font-semibold transition-all shrink-0 uppercase text-[11px] ${
                  filters.category === cat
                    ? 'bg-[#000000] text-[#FFFFFF] border-[#000000]'
                    : 'bg-[#FFFFFF] text-[#555555] border-[#D8D8D8] hover:border-[#000000]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Event Filter Dropdown */}
          <div className="flex items-center gap-2 shrink-0 font-mono text-xs">
            <span className="text-[11px] text-[#888888] uppercase font-bold shrink-0">EVENT:</span>
            <select
              value={filters.eventId}
              onChange={(e) => setFilters(prev => ({ ...prev, eventId: e.target.value }))}
              className="p-1.5 bg-[#FAFAFA] border border-[#D8D8D8] hover:border-[#000000] text-xs font-mono focus:outline-none max-w-[220px]"
            >
              <option value="ALL">ALL EVENTS</option>
              {events.map(e => (
                <option key={e.id} value={e.id}>
                  {e.title}
                </option>
              ))}
            </select>
          </div>

        </div>

        {/* Active Filters Summary */}
        <div className="flex items-center justify-between font-mono text-[11px] text-[#666666] border-t border-[#F0F0F0] pt-2">
          <div>
            SHOWING <strong className="text-[#000000]">{filteredPeople.length}</strong> COMMUNITY PROFILES
            {filters.category !== 'ALL' && <span> • Filtered by {filters.category}</span>}
            {filters.eventId !== 'ALL' && <span> • Attending {getEventTitleById(filters.eventId)}</span>}
          </div>

          {(filters.category !== 'ALL' || filters.eventId !== 'ALL' || filters.searchQuery || filters.connectionStatus !== 'ALL') && (
            <button
              onClick={() => setFilters({ searchQuery: '', category: 'ALL', eventId: 'ALL', connectionStatus: 'ALL' })}
              className="text-[#000000] underline font-bold hover:text-[#DC2626]"
            >
              RESET FILTERS
            </button>
          )}
        </div>

      </div>

      {/* Grid of Profile Cards */}
      {filteredPeople.length === 0 ? (
        <div className="py-20 text-center border-2 border-dashed border-[#D8D8D8] bg-[#FAFAFA] p-8 space-y-3">
          <AlertCircle className="w-10 h-10 text-[#888888] mx-auto" />
          <h3 className="font-heading font-black text-xl text-[#000000] uppercase">
            NO PROFILES MATCHED
          </h3>
          <p className="font-mono text-xs text-[#666666] max-w-md mx-auto">
            {filters.connectionStatus === 'CONNECTED'
              ? "You haven't connected with anyone yet. Click '+ CONNECT' on any card to request and manage your network."
              : filters.connectionStatus === 'REQUESTED'
              ? 'No pending connection requests.'
              : 'Try clearing your search query or selecting a different category or event.'}
          </p>
          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              onClick={() => setFilters({ searchQuery: '', category: 'ALL', eventId: 'ALL', connectionStatus: 'ALL' })}
              className="px-4 py-2 border border-[#000000] font-mono text-xs font-bold hover:bg-[#000000] hover:text-[#FFFFFF] transition-colors"
            >
              SHOW ALL PEOPLE
            </button>
            {!myProfile && (
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="px-4 py-2 bg-[#000000] text-[#FFFFFF] font-mono text-xs font-bold hover:bg-[#222222] transition-colors"
              >
                CREATE YOUR PROFILE
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPeople.map((person, idx) => (
            <PersonCard
              key={person.id}
              person={person}
              index={idx}
              connectionStatus={getConnectionStatus(person.id)}
              isCurrentUser={Boolean(person.isCurrentUser || (myProfile && myProfile.id === person.id))}
              onViewProfile={(id) => setSelectedPersonId(id)}
              onCycleConnection={cycleConnection}
              onEditProfile={() => setIsEditModalOpen(true)}
              getEventTitleById={getEventTitleById}
            />
          ))}
        </div>
      )}

    </div>
  );
};
