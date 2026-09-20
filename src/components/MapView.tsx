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

  const getVenueImage = (locationName: string, defaultImg?: string) => {
    const loc = locationName.toLowerCase();
    if (loc.includes('jio') || loc.includes('bkc')) {
      return '/images/jio-world-centre.png';
    }
    if (loc.includes('fairmont') || loc.includes('sahar')) {
      return '/images/fairmont-mumbai.jpg';
    }
    if (loc.includes('nesco') || loc.includes('goregaon')) {
      return '/images/ethglobal-mumbai.png';
    }
    if (loc.includes('taj lands') || loc.includes('bandra')) {
      return '/images/multichain-day.png';
    }
    if (loc.includes('taj mahal') || loc.includes('colaba')) {
      return '/images/money-layer.png';
    }
    if (loc.includes('ifbe') || loc.includes('ballard')) {
      return '/images/yield-layer.png';
    }
    return defaultImg || '/images/jio-world-centre.png';
  };

  const currentVenueImage = getVenueImage(selectedVenue?.location || '', selectedVenue?.imageUrl);

  // Google Map embed query
  const mapQuery = selectedVenue?.address
    ? encodeURIComponent(`${selectedVenue.location}, ${selectedVenue.address}`)
    : 'Jio+World+Centre+BKC+Mumbai';
  
  const googleMapEmbedUrl = `https://maps.google.com/maps?q=${mapQuery}&t=&z=13&ie=UTF8&iwloc=&output=embed`;
  const officialGoogleMapsLink = selectedVenue?.mapUrl || 'https://maps.app.goo.gl/yyQ84FcUdu4bmFPB6';

  return (
    <div className="w-full space-y-8 select-none">
      
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

      {/* Selected Venue Spotlight Card (Directly addressing user prompt) */}
      <div className="bg-[#FFFFFF] border-2 border-[#000000] overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-stretch">
        
        {/* Venue Photo (2nd given image for Jio World Centre / 3rd given image for Fairmont) */}
        <div className="lg:col-span-6 relative h-64 sm:h-80 lg:h-auto overflow-hidden bg-[#000000]">
          <img
            src={currentVenueImage}
            alt={selectedVenue?.location}
            className="w-full h-full object-cover object-center transition-transform duration-500 hover:scale-105"
          />
          <div className="absolute top-3 left-3 bg-[#000000] text-[#FFFFFF] px-3 py-1 font-mono text-[11px] font-bold tracking-wider">
            VENUE SPOTLIGHT
          </div>
        </div>

        {/* Venue Info Panel */}
        <div className="lg:col-span-6 p-6 sm:p-8 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            
            <div className="border-b border-[#D8D8D8] pb-4">
              <span className="font-mono text-xs text-[#666666] uppercase tracking-widest block font-bold mb-1">
                SELECTED VENUE
              </span>
              <h3 className="font-heading font-black text-2xl sm:text-4xl text-[#050505] uppercase">
                {selectedVenue?.location}
              </h3>
              <p className="font-mono text-xs text-[#444444] mt-1">
                {selectedVenue?.address || 'Mumbai, Maharashtra'}
              </p>
            </div>

            <div className="bg-[#FAFAFA] border border-[#D8D8D8] p-4 space-y-1">
              <span className="font-mono text-[10px] text-[#666666] uppercase tracking-wider block font-bold">
                EVENT AT THIS VENUE
              </span>
              <h4 className="font-heading font-black text-lg sm:text-xl text-[#000000]">
                {selectedVenue?.title}
              </h4>
              <p className="font-mono text-xs text-[#555555]">
                Time: <strong className="text-[#000000]">{selectedVenue?.startTime} — {selectedVenue?.endTime} IST</strong> • {selectedVenue?.startDate}
              </p>
            </div>

          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <a
              href={officialGoogleMapsLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#000000] hover:bg-[#222222] text-[#FFFFFF] px-5 py-3 font-mono text-xs font-bold transition-all"
            >
              <span>VIEW ON GOOGLE MAPS →</span>
              <ExternalLink className="w-4 h-4" />
            </a>

            <button
              onClick={() => onSelectEvent(selectedVenue.id)}
              className="inline-flex items-center gap-2 bg-transparent hover:bg-[#F5F5F5] text-[#000000] border border-[#000000] px-5 py-3 font-mono text-xs font-bold transition-all"
            >
              <span>VIEW EVENT BRIEF [01]</span>
            </button>
          </div>
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
