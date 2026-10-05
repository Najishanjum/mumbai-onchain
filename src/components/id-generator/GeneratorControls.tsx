import React, { useState, useEffect, useRef } from 'react';
import type {
  CardTemplate,
  CardTheme,
  JourneyMapView
} from './cardRenderer';
import { PRESET_CITIES, calculateDistanceKm, MUMBAI_COORDS, searchGlobalLocations } from './citiesData';
import type { CityLocation } from './citiesData';
import {
  Download,
  Share2,
  Copy,
  Check,
  ZoomIn,
  MapPin,
  MessageSquare,
  Sparkles,
  Layers,
  Palette,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Edit3,
  Search,
  Globe,
  X
} from 'lucide-react';

const XIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

interface GeneratorControlsProps {
  template: CardTemplate;
  setTemplate: (t: CardTemplate) => void;
  theme: CardTheme;
  setTheme: (t: CardTheme) => void;
  handle: string;
  setHandle: (h: string) => void;
  displayName: string;
  setDisplayName: (n: string) => void;
  bio?: string;
  location?: string;
  avatarUrl: string;
  isLoadingProfile: boolean;
  isProfileSuccess?: boolean;
  profileErrorMessage?: string | null;
  onFetchProfile: () => void;
  photoZoom: number;
  setPhotoZoom: (z: number) => void;
  tagline: string;
  setTagline: (t: string) => void;
  message: string;
  setMessage: (m: string) => void;
  selectedCity: CityLocation;
  setSelectedCity: (c: CityLocation) => void;
  mapView?: JourneyMapView;
  setMapView?: (v: JourneyMapView) => void;
  idNumber: number;
  onDownloadPng: () => void;
  onDownloadGif: () => void;
  isGeneratingGif: boolean;
  gifProgress: number;
  onShare: () => void;
  onPostX: () => void;
}

const PRESET_TAGLINES = [
  "I'm building onchain in Mumbai",
  "Building the future from Mumbai",
  "Building at MumbaiOnChain",
  "Attending MumbaiOnChain",
  "Speaking at MumbaiOnChain",
  "Hacking at MumbaiOnChain",
  "Learning at MumbaiOnChain",
  "Connecting at MumbaiOnChain",
  "Exploring Web3 in Mumbai",
  "Shipping from Mumbai",
  "Mumbai is building",
  "Onchain from Mumbai"
];

const PRESET_MESSAGES = [
  "gm Mumbai 👋 Here for MumbaiOnChain. Building, learning & way too much chai.",
  "Building the next generation of decentralized systems from Mumbai.",
  "See you onchain at MumbaiOnChain 2026!",
  "Connecting builders, researchers & protocols across India.",
  "Made in Mumbai. Verified on Ethereum."
];

const THEMES: { id: CardTheme; label: string; color: string }[] = [
  { id: 'night', label: 'Mumbai Night', color: '#5FE3D6' },
  { id: 'marine', label: 'Marine Drive', color: '#F59E0B' },
  { id: 'gateway', label: 'Gateway', color: '#C084FC' },
  { id: 'cyber', label: 'Cyber Mumbai', color: '#00F0FF' }
];

const QUICK_CITIES = [
  'USA',
  'Jabalpur',
  'San Francisco',
  'London',
  'Dubai',
  'Tokyo',
  'Bengaluru',
  'Berlin',
  'Singapore',
  'Delhi NCR'
];

export const GeneratorControls: React.FC<GeneratorControlsProps> = ({
  template,
  setTemplate,
  theme,
  setTheme,
  handle,
  setHandle,
  displayName,
  setDisplayName,
  bio,
  location,
  avatarUrl,
  isLoadingProfile,
  isProfileSuccess,
  profileErrorMessage,
  onFetchProfile,
  photoZoom,
  setPhotoZoom,
  tagline,
  setTagline,
  message,
  setMessage,
  selectedCity,
  setSelectedCity,
  mapView = 'shine3d',
  setMapView,
  idNumber,
  onDownloadPng,
  onDownloadGif,
  isGeneratingGif,
  gifProgress,
  onShare,
  onPostX
}) => {
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [customTaglineActive, setCustomTaglineActive] = useState(false);
  const [showEditDisplayName, setShowEditDisplayName] = useState(false);

  // Search Bar State for Journey Location
  const [locationSearchQuery, setLocationSearchQuery] = useState('');
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [searchResults, setSearchResults] = useState<CityLocation[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const distanceKm = calculateDistanceKm(
    selectedCity.lat,
    selectedCity.lon,
    MUMBAI_COORDS[0],
    MUMBAI_COORDS[1]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onFetchProfile();
    }
  };

  // Handle Search Input Change
  useEffect(() => {
    if (!locationSearchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingLocation(true);
      try {
        const results = await searchGlobalLocations(locationSearchQuery);
        setSearchResults(results);
      } finally {
        setIsSearchingLocation(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [locationSearchQuery]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="space-y-6">
      {/* 1. X Profile Lookup Section */}
      <div className="bg-[#12102E]/70 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-mono text-xs text-[#5FE3D6] uppercase tracking-wider font-bold">
            <XIcon className="w-4 h-4 text-[#1DA1F2]" />
            <span>1. Public X Profile</span>
          </div>
          {isProfileSuccess && !isLoadingProfile && (
            <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Profile Loaded</span>
            </div>
          )}
        </div>

        {/* Input & Action */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 font-mono text-base font-bold">
              @
            </div>
            <input
              type="text"
              value={handle}
              onChange={(e) => setHandle(e.target.value.replace(/^@/, '').trim())}
              onKeyDown={handleKeyDown}
              placeholder="yourusername"
              className="w-full pl-8 pr-4 py-3 bg-[#0A091E] border border-white/20 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-[#5FE3D6] focus:ring-1 focus:ring-[#5FE3D6] transition-all"
            />
          </div>
          <button
            type="button"
            onClick={onFetchProfile}
            disabled={isLoadingProfile}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-[#5FE3D6] to-[#B59CF2] hover:opacity-90 disabled:opacity-50 text-[#0A091E] font-heading font-black text-sm uppercase tracking-wide transition-all shadow-md active:scale-95 shrink-0"
          >
            {isLoadingProfile ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Fetching...</span>
              </>
            ) : (
              <>
                <XIcon className="w-4 h-4" />
                <span>Continue with X</span>
              </>
            )}
          </button>
        </div>

        {/* Error message banner if lookup fails */}
        {profileErrorMessage && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs font-mono">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{profileErrorMessage}</span>
          </div>
        )}

        {/* Compact Loaded Profile Card */}
        <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full overflow-hidden border border-[#5FE3D6]/60 shrink-0 bg-black flex items-center justify-center">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName || handle}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <span className="font-bold text-lg text-white">{(displayName[0] || handle[0] || 'M').toUpperCase()}</span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-white truncate">{displayName || `@${handle}`}</span>
                <button
                  type="button"
                  onClick={() => setShowEditDisplayName(!showEditDisplayName)}
                  className="text-gray-400 hover:text-[#5FE3D6] transition-colors"
                  title="Edit display name"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="font-mono text-xs text-gray-400">@{handle}</div>
            </div>

            {/* Photo Zoom control */}
            <div className="shrink-0 flex items-center gap-1.5 bg-black/40 px-2 py-1.5 rounded-lg border border-white/10">
              <ZoomIn className="w-3.5 h-3.5 text-gray-400" />
              <input
                type="range"
                min={1}
                max={2}
                step={0.1}
                value={photoZoom}
                onChange={(e) => setPhotoZoom(parseFloat(e.target.value))}
                className="w-16 accent-[#5FE3D6] cursor-pointer"
                title={`Zoom: ${Math.round(photoZoom * 100)}%`}
              />
            </div>
          </div>

          {/* Optional display name override edit field */}
          {showEditDisplayName && (
            <div className="pt-1">
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Edit Display Name on Card"
                className="w-full px-3 py-1.5 bg-[#0A091E] border border-[#5FE3D6]/40 rounded-lg text-white font-mono text-xs focus:outline-none focus:ring-1 focus:ring-[#5FE3D6]"
              />
            </div>
          )}

          {/* Bio & Location info */}
          {(bio || location) && (
            <div className="text-xs text-gray-300 font-mono space-y-1 pt-1 border-t border-white/5">
              {bio && <p className="line-clamp-2 italic text-gray-400">"{bio}"</p>}
              {location && (
                <div className="flex items-center gap-1 text-[#5FE3D6]">
                  <MapPin className="w-3 h-3" />
                  <span>{location}</span>
                </div>
              )}
            </div>
          )}
        </div>

        <p className="font-mono text-[11px] text-gray-400 leading-tight">
          Public X profile information is fetched via official X API v2. This card does not verify identity or event attendance.
        </p>
      </div>

      {/* 2. Template Selector */}
      <div className="bg-[#12102E]/70 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-xl space-y-3">
        <div className="flex items-center gap-2 font-mono text-xs text-[#5FE3D6] uppercase tracking-wider font-bold">
          <Layers className="w-4 h-4 text-[#B59CF2]" />
          <span>2. Select Card Template</span>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          <button
            type="button"
            onClick={() => setTemplate('classic')}
            className={`flex flex-col items-center justify-center p-3 rounded-xl border text-left transition-all ${
              template === 'classic'
                ? 'bg-gradient-to-b from-[#5FE3D6]/20 to-transparent border-[#5FE3D6] text-white shadow-lg shadow-[#5FE3D6]/10'
                : 'bg-[#0A091E]/60 border-white/10 text-gray-400 hover:border-white/30 hover:text-white'
            }`}
          >
            <span className="font-heading font-black text-xs uppercase">Classic</span>
            <span className="font-mono text-[10px] text-gray-400 mt-0.5">Signature MOC</span>
          </button>

          <button
            type="button"
            onClick={() => setTemplate('postcard')}
            className={`flex flex-col items-center justify-center p-3 rounded-xl border text-left transition-all ${
              template === 'postcard'
                ? 'bg-gradient-to-b from-[#F6A067]/20 to-transparent border-[#F6A067] text-white shadow-lg shadow-[#F6A067]/10'
                : 'bg-[#0A091E]/60 border-white/10 text-gray-400 hover:border-white/30 hover:text-white'
            }`}
          >
            <span className="font-heading font-black text-xs uppercase">Postcard</span>
            <span className="font-mono text-[10px] text-gray-400 mt-0.5">Greetings Card</span>
          </button>

          <button
            type="button"
            onClick={() => setTemplate('journey')}
            className={`flex flex-col items-center justify-center p-3 rounded-xl border text-left transition-all ${
              template === 'journey'
                ? 'bg-gradient-to-b from-[#B59CF2]/20 to-transparent border-[#B59CF2] text-white shadow-lg shadow-[#B59CF2]/10'
                : 'bg-[#0A091E]/60 border-white/10 text-gray-400 hover:border-white/30 hover:text-white'
            }`}
          >
            <span className="font-heading font-black text-xs uppercase">Journey</span>
            <span className="font-mono text-[10px] text-gray-400 mt-0.5">Route & Flight</span>
          </button>
        </div>
      </div>

      {/* 3. Theme Selector */}
      <div className="bg-[#12102E]/70 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-xl space-y-3">
        <div className="flex items-center gap-2 font-mono text-xs text-[#5FE3D6] uppercase tracking-wider font-bold">
          <Palette className="w-4 h-4 text-[#5FE3D6]" />
          <span>3. Card Color Theme</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTheme(t.id)}
              className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all ${
                theme === t.id
                  ? 'bg-white/10 border-white text-white shadow-md'
                  : 'bg-[#0A091E]/50 border-white/10 text-gray-400 hover:border-white/30'
              }`}
            >
              <div className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: t.color }} />
              <span className="font-mono text-xs truncate">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 4. Template-Specific Controls */}
      {template === 'postcard' && (
        <div className="bg-[#12102E]/70 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-xl space-y-3">
          <div className="flex items-center gap-2 font-mono text-xs text-[#F6A067] uppercase tracking-wider font-bold">
            <MessageSquare className="w-4 h-4" />
            <span>4. Postcard Message</span>
          </div>

          <textarea
            rows={2}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Write your Mumbai greeting..."
            className="w-full px-3.5 py-2.5 bg-[#0A091E] border border-white/20 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-[#F6A067] transition-all resize-none"
          />

          <div className="flex flex-wrap gap-1.5">
            {PRESET_MESSAGES.map((msg, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setMessage(msg)}
                className="text-[10px] font-mono px-2 py-1 rounded bg-white/5 hover:bg-white/15 text-gray-300 transition-colors border border-white/5"
              >
                Preset #{i + 1}
              </button>
            ))}
          </div>
        </div>
      )}

      {template === 'journey' && (
        <div className="bg-[#12102E]/70 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between font-mono text-xs text-[#5FE3D6] uppercase tracking-wider font-bold">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#5FE3D6]" />
              <span>4. Departing Location / Region Search</span>
            </div>
            <span className="text-[#F6A067] font-bold">{distanceKm.toLocaleString()} KM</span>
          </div>

          {/* Active Location Display */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#0A091E] border border-[#5FE3D6]/30">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-[#5FE3D6]/10 text-[#5FE3D6]">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <div className="font-heading font-black text-sm text-white flex items-center gap-2">
                  <span>{selectedCity.name}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-gray-300 font-normal">
                    {selectedCity.country}
                  </span>
                </div>
                <div className="text-[11px] font-mono text-gray-400">
                  {selectedCity.isDomestic ? 'Domestic Route • Regional India Map' : 'International Route • Full World Map'}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs font-mono font-bold text-[#5FE3D6]">
                ➔ Mumbai
              </div>
              <div className="text-[11px] font-mono text-gray-400">
                {distanceKm.toLocaleString()} km
              </div>
            </div>
          </div>

          {/* Map View Mode Selector (3D Shining Orbit, 3D Planet Globe, 2D States Map) */}
          <div className="space-y-1.5">
            <div className="text-[11px] font-mono text-gray-400 uppercase tracking-wider flex items-center justify-between">
              <span>Map Render Mode:</span>
              <span className="text-[#5FE3D6] text-[10px]">
                {mapView === 'shine3d' ? '✨ Orbit Night Glow' : mapView === 'globe3d' ? '🌍 3D Planet Globe' : '🗺️ 2D States Map'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setMapView?.('shine3d')}
                className={`px-3 py-2 rounded-xl text-xs font-heading font-bold transition-all flex flex-col items-center gap-1 border ${
                  mapView === 'shine3d'
                    ? 'bg-[#5FE3D6]/20 border-[#5FE3D6] text-[#5FE3D6] shadow-md shadow-[#5FE3D6]/20'
                    : 'bg-[#0A091E] border-white/10 text-gray-400 hover:text-white hover:border-white/30'
                }`}
              >
                <span className="text-sm">✨</span>
                <span className="text-[11px]">3D Shining</span>
              </button>

              <button
                type="button"
                onClick={() => setMapView?.('globe3d')}
                className={`px-3 py-2 rounded-xl text-xs font-heading font-bold transition-all flex flex-col items-center gap-1 border ${
                  mapView === 'globe3d'
                    ? 'bg-[#F6A067]/20 border-[#F6A067] text-[#F6A067] shadow-md shadow-[#F6A067]/20'
                    : 'bg-[#0A091E] border-white/10 text-gray-400 hover:text-white hover:border-white/30'
                }`}
              >
                <span className="text-sm">🌍</span>
                <span className="text-[11px]">3D Globe</span>
              </button>

              <button
                type="button"
                onClick={() => setMapView?.('states2d')}
                className={`px-3 py-2 rounded-xl text-xs font-heading font-bold transition-all flex flex-col items-center gap-1 border ${
                  mapView === 'states2d'
                    ? 'bg-[#B59CF2]/20 border-[#B59CF2] text-[#B59CF2] shadow-md shadow-[#B59CF2]/20'
                    : 'bg-[#0A091E] border-white/10 text-gray-400 hover:text-white hover:border-white/30'
                }`}
              >
                <span className="text-sm">🗺️</span>
                <span className="text-[11px]">2D States</span>
              </button>
            </div>
          </div>

          {/* Location Search Bar with Autocomplete */}
          <div ref={searchContainerRef} className="relative">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                {isSearchingLocation ? (
                  <Loader2 className="w-4 h-4 animate-spin text-[#5FE3D6]" />
                ) : (
                  <Search className="w-4 h-4 text-gray-400" />
                )}
              </div>
              <input
                type="text"
                value={locationSearchQuery}
                onFocus={() => setIsDropdownOpen(true)}
                onChange={(e) => {
                  setLocationSearchQuery(e.target.value);
                  setIsDropdownOpen(true);
                }}
                placeholder="Search any region or city (e.g. USA, San Francisco, London, Jabalpur, Tokyo...)"
                className="w-full pl-10 pr-10 py-2.5 bg-[#0A091E] border border-white/20 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-[#5FE3D6] focus:ring-1 focus:ring-[#5FE3D6] transition-all"
              />
              {locationSearchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setLocationSearchQuery('');
                    setSearchResults([]);
                  }}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Live Search Suggestions Dropdown */}
            {isDropdownOpen && (searchResults.length > 0 || locationSearchQuery.trim().length > 0) && (
              <div className="absolute z-50 left-0 right-0 mt-1.5 max-h-60 overflow-y-auto bg-[#0E0D28] border border-white/20 rounded-xl shadow-2xl divide-y divide-white/5 backdrop-blur-2xl">
                {searchResults.length > 0 ? (
                  searchResults.map((city, idx) => {
                    const dist = calculateDistanceKm(city.lat, city.lon, MUMBAI_COORDS[0], MUMBAI_COORDS[1]);
                    return (
                      <button
                        key={`${city.name}-${city.lat}-${idx}`}
                        type="button"
                        onClick={() => {
                          setSelectedCity(city);
                          setLocationSearchQuery('');
                          setIsDropdownOpen(false);
                        }}
                        className="w-full px-4 py-2.5 text-left flex items-center justify-between hover:bg-white/10 transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <MapPin className="w-3.5 h-3.5 text-[#5FE3D6] shrink-0" />
                          <div>
                            <span className="font-heading font-bold text-xs text-white">{city.name}</span>
                            <span className="font-mono text-[10px] text-gray-400 ml-1.5">({city.country})</span>
                          </div>
                        </div>
                        <span className="font-mono text-[11px] text-[#F6A067] shrink-0 font-semibold">
                          {dist.toLocaleString()} km
                        </span>
                      </button>
                    );
                  })
                ) : (
                  <div className="px-4 py-3 text-center text-xs font-mono text-gray-400">
                    {isSearchingLocation ? 'Searching global database...' : 'No exact match found. Try typing another region or city name.'}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick Preset Location Chips */}
          <div className="space-y-1.5">
            <div className="text-[11px] font-mono text-gray-400 uppercase tracking-wider">
              Popular Regions:
            </div>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_CITIES.map((name) => {
                const city = PRESET_CITIES.find((c) => c.name.toLowerCase() === name.toLowerCase());
                if (!city) return null;
                const isSelected = selectedCity.name.toLowerCase() === name.toLowerCase();
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setSelectedCity(city)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all border ${
                      isSelected
                        ? 'bg-[#5FE3D6] text-[#0A091E] font-bold border-[#5FE3D6] shadow-sm'
                        : 'bg-white/5 hover:bg-white/15 text-gray-300 border-white/10'
                    }`}
                  >
                    {name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 5. Tagline Selector */}
      <div className="bg-[#12102E]/70 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-mono text-xs text-[#5FE3D6] uppercase tracking-wider font-bold">
            <Sparkles className="w-4 h-4 text-[#F6A067]" />
            <span>5. Identity Tagline</span>
          </div>
          <button
            type="button"
            onClick={() => setCustomTaglineActive(!customTaglineActive)}
            className="text-[11px] font-mono text-gray-400 hover:text-[#5FE3D6] underline"
          >
            {customTaglineActive ? 'Choose preset' : 'Write custom'}
          </button>
        </div>

        {customTaglineActive ? (
          <input
            type="text"
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            placeholder="Type your custom tagline..."
            maxLength={45}
            className="w-full px-3.5 py-2.5 bg-[#0A091E] border border-white/20 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-[#5FE3D6] transition-all"
          />
        ) : (
          <select
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-[#0A091E] border border-white/20 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-[#5FE3D6] transition-all cursor-pointer"
          >
            {PRESET_TAGLINES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* 6. Primary Action Buttons */}
      <div className="space-y-3 pt-2">
        <div className="grid grid-cols-2 gap-3">
          {/* Download PNG */}
          <button
            type="button"
            onClick={onDownloadPng}
            className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#5FE3D6] to-[#B59CF2] hover:opacity-95 text-[#0A091E] font-heading font-black text-sm uppercase tracking-wide transition-all shadow-lg shadow-[#5FE3D6]/20 active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>Download PNG</span>
          </button>

          {/* Post to X */}
          <button
            type="button"
            onClick={onPostX}
            className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-[#1DA1F2] hover:bg-[#1a94df] text-white font-heading font-black text-sm uppercase tracking-wide transition-all shadow-lg shadow-[#1DA1F2]/20 active:scale-95"
          >
            <XIcon className="w-4 h-4 fill-white" />
            <span>Post to X</span>
          </button>
        </div>

        {/* Journey Animated GIF option */}
        {template === 'journey' && (
          <button
            type="button"
            onClick={onDownloadGif}
            disabled={isGeneratingGif}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#1C184E] hover:bg-[#28226E] border border-[#5FE3D6]/40 text-[#5FE3D6] font-mono text-xs font-bold uppercase transition-all"
          >
            {isGeneratingGif ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating GIF... {gifProgress}%</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Export Animated Flight GIF</span>
              </>
            )}
          </button>
        )}

        {/* Share Button */}
        <button
          type="button"
          onClick={onShare}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 font-mono text-xs transition-all"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Share MumbaiOnChain ID</span>
        </button>

        {/* Copy Share Caption */}
        <button
          type="button"
          onClick={() => {
            const text = `I'm building onchain in Mumbai! Check out my official MumbaiOnChain ID (MOC #${String(idNumber).padStart(4, '0')}) #MumbaiOnChain https://mumbaionchain.xyz`;
            navigator.clipboard.writeText(text);
            setCopiedCaption(true);
            setTimeout(() => setCopiedCaption(false), 2000);
          }}
          className="w-full flex items-center justify-center gap-1.5 py-2 text-gray-400 hover:text-white font-mono text-[11px] transition-colors"
        >
          {copiedCaption ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copiedCaption ? 'Caption copied to clipboard!' : 'Copy post caption'}</span>
        </button>
      </div>
    </div>
  );
};
