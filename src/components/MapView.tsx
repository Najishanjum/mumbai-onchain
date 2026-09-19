import React, { useState } from 'react';
import type { EventItem } from '../types/event';
import { MapPin, Navigation, Compass, ExternalLink, Maximize2 } from 'lucide-react';
import { StatusBadge } from './StatusBadge';

interface MapViewProps {
  events: EventItem[];
  onSelectEvent: (eventId: string) => void;
}

export const MapView: React.FC<MapViewProps> = ({ events, onSelectEvent }) => {
  // Venues with coordinates or addresses
  const venueEvents = events.filter(e => e.location && e.location !== 'TBA, Mumbai');
  const [selectedVenue, setSelectedVenue] = useState<EventItem>(venueEvents[0] || events[0]);

  // Determine custom venue background image matching prompt request:
  // 3rd image: Jio World Centre lotus fountain background
  // 4th image: Fairmont Mumbai venue image
  const getVenueBgImage = (locationName: string) => {
    const locLower = locationName.toLowerCase();
    if (locLower.includes('jio') || locLower.includes('bkc')) {
      return '/images/jio-world-centre.png';
    }
    if (locLower.includes('fairmont') || locLower.includes('sahar')) {
      return '/images/fairmont-mumbai.png';
    }
    return selectedVenue.imageUrl || null;
  };

  const venueBgImage = getVenueBgImage(selectedVenue?.location || '');

  // Google Map embed URL query
  const mapQuery = selectedVenue?.address
    ? encodeURIComponent(`${selectedVenue.location}, ${selectedVenue.address}`)
    : 'Jio+World+Centre+BKC+Mumbai';
  
  const googleMapEmbedUrl = `https://maps.google.com/maps?q=${mapQuery}&t=&z=13&ie=UTF8&iwloc=&output=embed`;
  const officialGoogleMapsLink = 'https://maps.app.goo.gl/yyQ84FcUdu4bmFPB6';

  return (
    <div className="w-full space-y-6">
      
      {/* Header */}
      <div className="bg-[#0A0A0A] border border-[#202020] rounded-3xl p-6 tech-grid shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 font-mono text-xs text-[#22C55E] uppercase tracking-widest mb-1">
              <Compass className="w-3.5 h-3.5" />
              <span>MUMBAI VENUE NAVIGATION ENGINE</span>
            </div>
            <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-white tracking-wide">
              MUMBAI EVENT MAP // 01–08 NOV
            </h2>
            <p className="font-mono text-xs text-zinc-400 mt-1">
              Interactive Google Maps navigation for Jio World Centre (BKC), Fairmont Mumbai, Taj Lands End, NESCO, and Ballard Estate.
            </p>
          </div>

          <a
            href={officialGoogleMapsLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#181818] hover:bg-[#252525] text-white border border-[#333] px-4 py-2.5 rounded-xl font-mono text-xs font-bold transition-all shrink-0 active:scale-95"
          >
            <ExternalLink className="w-4 h-4 text-[#627EEA]" />
            <span>OPEN OFFICIAL MUMBAI MAP</span>
          </a>
        </div>
      </div>

      {/* Main Interactive Map Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Interactive Google Map Embed Frame */}
        <div className="lg:col-span-7 bg-[#080808] border border-[#202020] rounded-3xl overflow-hidden shadow-2xl flex flex-col min-h-[460px]">
          
          <div className="p-4 bg-[#0A0A0A] border-b border-[#202020] flex items-center justify-between z-10">
            <span className="font-mono text-xs text-zinc-300 font-bold flex items-center gap-2">
              <Navigation className="w-4 h-4 text-[#627EEA]" />
              INTERACTIVE GOOGLE MAPS — {selectedVenue?.location || 'MUMBAI'}
            </span>
            <span className="font-mono text-[10px] text-zinc-500 bg-[#121212] px-2 py-1 rounded border border-[#222]">
              Pinch / Scroll to Zoom
            </span>
          </div>

          {/* Real Google Map Embed */}
          <div className="relative w-full h-[380px] bg-[#101010]">
            <iframe
              title="Mumbai Event Map"
              width="100%"
              height="100%"
              style={{ border: 0, filter: 'contrast(1.05) saturate(1.1)' }}
              loading="lazy"
              allowFullScreen
              src={googleMapEmbedUrl}
            />
          </div>

          {/* Quick Location Pins Switcher Bar */}
          <div className="p-3 bg-[#0D0D0D] border-t border-[#202020] overflow-x-auto flex items-center gap-2">
            <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-wider shrink-0 mr-1">QUICK VENUES:</span>
            {venueEvents.map((evt) => {
              const isSelected = selectedVenue?.id === evt.id;
              return (
                <button
                  key={evt.id}
                  onClick={() => setSelectedVenue(evt)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-mono shrink-0 transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-[#627EEA] text-white border-[#627EEA] shadow-glow-eth font-bold'
                      : 'bg-[#141414] text-zinc-400 border-[#252525] hover:border-[#444] hover:text-white'
                  }`}
                >
                  <MapPin className="w-3 h-3" />
                  <span>{evt.location}</span>
                </button>
              );
            })}
          </div>

        </div>

        {/* Selected Venue Details Panel with Custom Background Image */}
        <div className="lg:col-span-5 relative bg-[#0A0A0A] border border-[#202020] rounded-3xl p-6 overflow-hidden shadow-card min-h-[460px] flex flex-col justify-between group">
          
          {/* Custom Venue Background Image with Gradient Overlay */}
          {venueBgImage && (
            <div className="absolute inset-0 z-0 pointer-events-none">
              <img
                src={venueBgImage}
                alt={selectedVenue.location}
                className="w-full h-full object-cover object-center opacity-35 group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/90 to-[#050505]/75" />
            </div>
          )}

          {selectedVenue ? (
            <div className="relative z-10 space-y-5">
              
              <div className="flex items-center justify-between border-b border-[#202020] pb-3">
                <StatusBadge status={selectedVenue.status} size="sm" />
                <span className="font-mono text-xs text-zinc-300 font-bold bg-black/60 px-2.5 py-0.5 rounded border border-zinc-700">
                  {selectedVenue.startDate}
                </span>
              </div>

              <div>
                <span className="font-mono text-[10px] text-[#627EEA] font-extrabold uppercase tracking-widest block mb-1">
                  SELECTED VENUE
                </span>
                <h3 className="font-heading font-extrabold text-2xl text-white">
                  {selectedVenue.location}
                </h3>
                <p className="font-mono text-xs text-zinc-300 mt-1 leading-relaxed">
                  {selectedVenue.address || 'Bandra Kurla Complex (BKC), Mumbai, Maharashtra 400051'}
                </p>
              </div>

              {/* Box Info Container */}
              <div className="bg-[#121212]/90 backdrop-blur-md p-4 rounded-2xl border border-[#252525] space-y-2.5 shadow-xl">
                <span className="font-mono text-[10px] text-[#8B5CF6] uppercase font-bold tracking-widest block">
                  EVENT AT THIS VENUE
                </span>
                <h4 className="font-heading font-extrabold text-lg text-white">{selectedVenue.title}</h4>
                <div className="font-mono text-xs text-zinc-300 space-y-1">
                  <p><strong className="text-zinc-400">Time:</strong> {selectedVenue.startTime} - {selectedVenue.endTime} IST</p>
                  <p><strong className="text-zinc-400">Organizer:</strong> {selectedVenue.organizer}</p>
                </div>
              </div>

              <div className="space-y-2.5 pt-2">
                <a
                  href={selectedVenue.mapUrl || officialGoogleMapsLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 bg-[#22C55E] hover:bg-[#16A34A] text-white px-4 py-3 rounded-xl font-mono text-xs font-bold transition-all shadow-lg active:scale-95"
                >
                  <MapPin className="w-4 h-4" />
                  <span>OPEN IN GOOGLE MAPS</span>
                </a>

                <button
                  onClick={() => onSelectEvent(selectedVenue.id)}
                  className="w-full inline-flex items-center justify-center gap-2 bg-[#181818] hover:bg-[#252525] text-white border border-[#333] px-4 py-2.5 rounded-xl font-mono text-xs font-semibold transition-colors"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>VIEW FULL EVENT DETAILS</span>
                </button>
              </div>

            </div>
          ) : (
            <div className="py-12 text-center font-mono text-xs text-zinc-500 relative z-10">
              Select a venue node to inspect locations.
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
