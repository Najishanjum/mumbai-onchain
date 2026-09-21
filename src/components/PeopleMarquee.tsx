import React, { useMemo } from 'react';
import { usePeopleStore } from '../lib/usePeopleStore';
import type { PersonProfile } from '../types/person';

interface PeopleMarqueeProps {
  onSelectPerson?: (personId: string) => void;
}

export const PeopleMarquee: React.FC<PeopleMarqueeProps> = ({ onSelectPerson }) => {
  const { people, setSelectedPersonId } = usePeopleStore();

  const handlePersonClick = (personId: string) => {
    setSelectedPersonId(personId);
    if (onSelectPerson) {
      onSelectPerson(personId);
    }
  };

  // Build repeated list to ensure smooth seamless looping across any screen size
  const displayHalves = useMemo(() => {
    if (!people || people.length === 0) {
      return null;
    }

    // Multiply so each half has at least 12 items for ultra-wide seamlessness
    const multiplier = Math.max(2, Math.ceil(14 / Math.max(1, people.length)));
    const extendedList: PersonProfile[] = [];
    for (let i = 0; i < multiplier; i++) {
      extendedList.push(...people);
    }

    // Two identical halves for a zero-jump infinite -50% to 0% translation
    return [extendedList, extendedList];
  }, [people]);

  return (
    <div
      className="w-full bg-[#000000] text-[#FFFFFF] border-b border-[#1A1A1A] py-2 overflow-hidden select-none relative z-20 cursor-default"
      title="Mumbai Community Stream (Hover to pause, click any person to view profile)"
    >
      {/* Ticker Container moving continuously from Left to Right */}
      <div className="animate-ticker-ltr flex items-center">
        {displayHalves ? (
          displayHalves.map((half, halfIdx) => (
            <div
              key={halfIdx}
              className="flex items-center shrink-0 space-x-6 pr-6"
              aria-hidden={halfIdx === 1 ? 'true' : undefined}
            >
              {half.map((person, idx) => (
                <React.Fragment key={`${person.id}-${halfIdx}-${idx}`}>
                  <button
                    type="button"
                    onClick={() => handlePersonClick(person.id)}
                    className="inline-flex items-center gap-2 text-left group cursor-pointer focus:outline-none transition-colors"
                  >
                    {/* Pulsing indicator dot */}
                    <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] inline-block shrink-0 animate-pulse group-hover:scale-125 transition-transform" />
                    
                    {/* NAME · CITY format in IBM Plex Mono */}
                    <span className="font-mono text-xs sm:text-[13px] font-bold uppercase tracking-wider text-[#FFFFFF] group-hover:text-[#F97316] transition-colors whitespace-nowrap">
                      {person.name}
                    </span>
                    <span className="text-[#666666] font-mono text-xs select-none">
                      ·
                    </span>
                    <span className="font-mono text-xs sm:text-[13px] font-medium uppercase tracking-wider text-[#A3A3A3] group-hover:text-[#FFFFFF] transition-colors whitespace-nowrap">
                      {person.city || 'MUMBAI'}
                    </span>
                  </button>

                  {/* Accent diamond separator matching reference */}
                  <span className="text-[#F97316] text-[10px] sm:text-xs select-none shrink-0" aria-hidden="true">
                    ◆
                  </span>
                </React.Fragment>
              ))}
            </div>
          ))
        ) : (
          /* Fallback when no profiles are present yet */
          <div className="flex items-center space-x-6 px-4">
            <span className="inline-flex items-center gap-2 font-mono text-xs text-[#888888] uppercase tracking-wider whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] inline-block animate-pulse" />
              <span>NO COMMUNITY PROFILES YET · BE THE FIRST TO CREATE ONE</span>
            </span>
            <span className="text-[#F97316] text-[10px] sm:text-xs select-none">◆</span>
            <span className="font-mono text-xs text-[#666666] uppercase tracking-wider whitespace-nowrap">
              NAVIGATE TO PEOPLE / CONNECT TO PUBLISH YOUR PROFILE
            </span>
            <span className="text-[#F97316] text-[10px] sm:text-xs select-none">◆</span>
          </div>
        )}
      </div>
    </div>
  );
};
