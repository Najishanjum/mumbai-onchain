import React, { useState } from 'react';
import type { EventItem } from '../types/event';
import { ExternalLink, Compass } from 'lucide-react';

interface MapViewProps {
  events: EventItem[];
  onSelectEvent: (eventId: string) => void;
}

export const MapView: React.FC<MapViewProps> = ({ events, onSelectEvent }) => {
  const venueEvents = events.filter(e => e.location && e.location !== 'TBA, Mumbai');
  const [selectedVenue, setSelectedVenue] = useState<EventItem>(venueEvents[0] || events[0]);

  // Google Map embed query
  const mapQuery = selectedVenue?.address
    ? encodeURIComponent(`${selectedVenue.location}, ${selectedVenue.address}`)
    : 'Jio+World+Centre+BKC+Mumbai';
  
  const googleMapEmbedUrl = `https://maps.google.com/maps?q=${mapQuery}&t=&z=13&ie=UTF8&iwloc=&output=embed`;
  const officialGoogleMapsLink = selectedVenue?.mapUrl || 'https://maps.app.goo.gl/yyQ84FcUdu4bmFPB6';

  return (
    <div className="w-full space-y-6 select-none">
      
      {/* Header */}
      <div className="bg-[#FFFFFF] border border-[#000000] p-6 sm:p-8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#D8D8D8] pb-6">
          <div>
            <div className="font-mono text-xs text-[#666666] uppercase tracking-widest mb-1 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-[#000000]" />
              <span>GEOSPATIAL DIRECTORY // ASIA/KOLKATA</span>
            </div>
            <h2 className="font-heading font-black text-3xl sm:text-5xl text-[#050505] tracking-tight uppercase">
              MUMBAI EVENT MAP
            </h2>
            <p className="font-mono text-xs text-[#555555] mt-1 max-w-xl">
              Physical node navigation across Jio World Centre (BKC), Fairmont Mumbai, Taj Lands End, NESCO, and Ballard Estate.
            </p>
          </div>

          <a
            href="https://maps.app.goo.gl/yyQ84FcUdu4bmFPB6"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#000000] hover:bg-[#222222] text-[#FFFFFF] px-5 py-3 font-mono text-xs font-bold transition-all shrink-0"
          >
            <span>OPEN OFFICIAL MUMBAI MAP</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Map Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left: Interactive Embedded Google Map */}
        <div className="lg:col-span-7 bg-[#FFFFFF] border-2 border-[#000000] overflow-hidden flex flex-col min-h-[440px]">
          <div className="bg-[#000000] text-[#FFFFFF] px-4 py-2.5 flex items-center justify-between font-mono text-xs">
            <span className="font-bold truncate">LOCATION: {selectedVenue?.location}</span>
            <span className="text-[#A0A0A0] text-[11px] shrink-0 ml-2">INTERACTIVE VIEW</span>
          </div>

          <div className="flex-1 w-full min-h-[400px]">
            <iframe
              title="Mumbai Venue Map"
              width="100%"
              height="100%"
              style={{ border: 0, minHeight: '400px' }}
              loading="lazy"
              allowFullScreen
              src={googleMapEmbedUrl}
            />
          </div>

          <div className="p-3 bg-[#FAFAFA] border-t border-[#D8D8D8] flex items-center justify-between font-mono text-xs">
            <span className="text-[#555555] truncate max-w-md">{selectedVenue?.address || selectedVenue?.location}</span>
            <a
              href={officialGoogleMapsLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#000000] font-bold hover:underline shrink-0 ml-2"
            >
              VIEW ON MAP →
            </a>
          </div>
        </div>

        {/* Right: Venue Catalogue Selector */}
        <div className="lg:col-span-5 space-y-3">
          <div className="font-mono text-xs uppercase tracking-widest text-[#666666] font-bold pb-1">
            SELECT KEY MUMBAI VENUES:
          </div>

          <div className="space-y-2">
            {venueEvents.map((evt, idx) => {
              const isSelected = selectedVenue?.id === evt.id;
              return (
                <div
                  key={evt.id}
                  onClick={() => setSelectedVenue(evt)}
                  className={`p-4 border transition-all cursor-pointer select-none ${
                    isSelected
                      ? 'bg-[#000000] text-[#FFFFFF] border-[#000000]'
                      : 'bg-[#FFFFFF] text-[#050505] border-[#D8D8D8] hover:border-[#000000]'
                  }`}
                >
                  <div className="flex items-center justify-between font-mono text-[11px] mb-1">
                    <span className={isSelected ? 'text-[#F97316] font-bold' : 'text-[#666666]'}>
                      [{String(idx + 1).padStart(2, '0')}] {evt.category}
                    </span>
                    <span className={isSelected ? 'text-[#CCCCCC]' : 'text-[#888888]'}>
                      {evt.startDate.slice(5)}
                    </span>
                  </div>

                  <h4 className="font-heading font-black text-base leading-snug">
                    {evt.location}
                  </h4>

                  <div className="flex items-center justify-between font-mono text-xs mt-2 pt-2 border-t border-current border-opacity-20">
                    <span className="truncate">{evt.title}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectEvent(evt.id);
                        }}
                        className="underline text-[11px] hover:font-bold"
                      >
                        BRIEF →
                      </button>
                      <span className="shrink-0 text-[11px] font-bold">
                        {isSelected ? '●' : '○'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
};
