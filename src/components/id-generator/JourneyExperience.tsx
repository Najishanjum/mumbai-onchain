import React, { useState, useEffect } from 'react';
import {
  Search,
  Plane,
  Train,
  MapPin,
  Compass,
  ArrowRight,
  Download,
  Share2,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  ChevronRight,
  Loader2,
  ZoomIn,
  Edit3
} from 'lucide-react';
import {
  COMPREHENSIVE_CITIES,
  searchLocations
} from './locationService';
import {
  calculateHaversineDistance,
  generateRailwayRoute,
  generateGeodesicArc,
  detectStatesCrossed,
  calculateEstimatedTravelTime,
  calculateTimezoneDifference,
  MUMBAI_METADATA,
  type CityMetadata
} from './geoEngine';
import { CardCanvas, type CardCanvasRef } from './CardCanvas';

const XIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

interface JourneyExperienceProps {
  handle: string;
  setHandle: (h: string) => void;
  displayName: string;
  setDisplayName: (n: string) => void;
  avatarUrl: string;
  avatarImage: HTMLImageElement | null;
  idNumber: number;
  onDownloadPng: () => void;
  onDownloadGif: () => void;
  isGeneratingGif: boolean;
  gifProgress: number;
  onShare: () => void;
  onPostX: () => void;
  canvasRef: React.RefObject<CardCanvasRef | null>;
}

export const JourneyExperience: React.FC<JourneyExperienceProps> = ({
  handle,
  setHandle,
  displayName,
  setDisplayName,
  avatarUrl,
  avatarImage,
  idNumber,
  onDownloadPng,
  onDownloadGif,
  isGeneratingGif,
  gifProgress,
  onShare,
  onPostX,
  canvasRef
}) => {
  // Step state: 1: Search, 2: Mode, 3: Journey & Card
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);

  // Selected Origin Location
  const [selectedCity, setSelectedCity] = useState<CityMetadata>(COMPREHENSIVE_CITIES[0]); // Jabalpur default
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CityMetadata[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Travel Mode (Flight vs Train)
  const [travelMode, setTravelMode] = useState<'flight' | 'train'>('flight');

  // Interactive Card Customization
  const [tagline, setTagline] = useState<string>("I'm going to Devcon 8");
  const [customTagline, setCustomTagline] = useState(false);
  const [showEditDisplayName, setShowEditDisplayName] = useState(false);
  const [photoZoom, setPhotoZoom] = useState(1.1);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      const results = await searchLocations(searchQuery);
      setSearchResults(results);
      setIsSearching(false);
      setShowDropdown(true);
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Derived Telemetry & Calculations
  const distanceKm =
    travelMode === 'train'
      ? generateRailwayRoute(selectedCity.name, { lat: selectedCity.lat, lon: selectedCity.lon }).distanceKm
      : calculateHaversineDistance(selectedCity.lat, selectedCity.lon, MUMBAI_METADATA.lat, MUMBAI_METADATA.lon);

  const durationStr = calculateEstimatedTravelTime(distanceKm, travelMode);
  const timezoneInfo = calculateTimezoneDifference(selectedCity.utcOffsetHours);

  // Calculate states crossed
  const routePoints =
    travelMode === 'train'
      ? generateRailwayRoute(selectedCity.name, { lat: selectedCity.lat, lon: selectedCity.lon }).coords
      : generateGeodesicArc(selectedCity.lat, selectedCity.lon, MUMBAI_METADATA.lat, MUMBAI_METADATA.lon, 40);

  const statesCrossed = detectStatesCrossed(routePoints);

  const handleSelectCity = (city: CityMetadata) => {
    setSelectedCity(city);
    setSearchQuery(`${city.name}, ${city.state || city.country}`);
    setShowDropdown(false);
    setActiveStep(2);
  };

  const quickCities = [
    COMPREHENSIVE_CITIES[0], // Jabalpur
    COMPREHENSIVE_CITIES[1], // Bhopal
    COMPREHENSIVE_CITIES[2], // Delhi
    COMPREHENSIVE_CITIES[3], // Nagpur
    COMPREHENSIVE_CITIES[4], // Bengaluru
    COMPREHENSIVE_CITIES[36], // Berlin
    COMPREHENSIVE_CITIES[40], // Dubai
    COMPREHENSIVE_CITIES[41], // Singapore
  ];

  return (
    <div className="space-y-8">
      {/* 1. Interactive Step Progress Header */}
      <div className="flex items-center justify-between bg-[#12102E]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-xl">
        <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto py-1">
          <button
            type="button"
            onClick={() => setActiveStep(1)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all shrink-0 ${
              activeStep === 1
                ? 'bg-[#5FE3D6] text-[#070920] shadow-md shadow-[#5FE3D6]/20'
                : 'bg-white/5 text-gray-300 hover:text-white'
            }`}
          >
            <span>1. Search Origin</span>
          </button>

          <ChevronRight className="w-3.5 h-3.5 text-gray-500 shrink-0" />

          <button
            type="button"
            onClick={() => setActiveStep(2)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all shrink-0 ${
              activeStep === 2
                ? 'bg-[#B59CF2] text-[#070920] shadow-md shadow-[#B59CF2]/20'
                : 'bg-white/5 text-gray-300 hover:text-white'
            }`}
          >
            <span>2. Mode & Confirm</span>
          </button>

          <ChevronRight className="w-3.5 h-3.5 text-gray-500 shrink-0" />

          <button
            type="button"
            onClick={() => setActiveStep(3)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all shrink-0 ${
              activeStep === 3
                ? 'bg-[#F6A067] text-[#070920] shadow-md shadow-[#F6A067]/20'
                : 'bg-white/5 text-gray-300 hover:text-white'
            }`}
          >
            <span>3. Devcon 8 Card</span>
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-[#5FE3D6]">
          <Sparkles className="w-4 h-4" />
          <span>Interactive Journey</span>
        </div>
      </div>

      {/* STEP 1: INTRO & LOCATION SEARCH (Matching Screenshot 1 & 2) */}
      {activeStep === 1 && (
        <div className="space-y-6">
          {/* Main Intro Card (Screenshot 1) */}
          <div className="relative overflow-hidden rounded-3xl border border-[#B59CF2]/40 bg-gradient-to-b from-[#18143C]/95 via-[#100D2B]/90 to-[#070617] p-8 sm:p-12 shadow-2xl text-center space-y-6">
            <div className="absolute top-4 left-6 font-mono text-xs text-[#B59CF2] font-bold uppercase tracking-wider">
              YOUR CARD
            </div>

            {/* Devcon VIII India Logo Emblem */}
            <div className="flex justify-center pt-2">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#B59CF2] via-[#5FE3D6] to-[#F6A067] p-[1.5px] shadow-lg shadow-[#5FE3D6]/20">
                  <div className="w-full h-full bg-[#0A091E] rounded-2xl flex items-center justify-center">
                    <span className="font-heading font-black text-2xl text-transparent bg-clip-text bg-gradient-to-r from-[#5FE3D6] to-[#B59CF2]">
                      8
                    </span>
                  </div>
                </div>
                <div className="absolute -inset-2 bg-[#5FE3D6]/20 blur-lg rounded-full -z-10" />
              </div>
            </div>

            <div className="space-y-2 max-w-lg mx-auto">
              <h2 className="text-3xl sm:text-4xl font-heading font-black text-white tracking-tight">
                Where are you travelling from?
              </h2>
              <p className="font-mono text-sm text-gray-400">
                Type your city in "Travelling from" to generate your journey to Devcon 8 Mumbai.
              </p>
            </div>

            {/* Animated Pixel Icon (Plane / Train) */}
            <div className="flex justify-center py-2">
              <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-inner animate-pulse">
                {travelMode === 'flight' ? (
                  <Plane className="w-8 h-8 text-[#FFD23F] -rotate-45" />
                ) : (
                  <Train className="w-8 h-8 text-[#5FE3D6]" />
                )}
              </div>
            </div>

            {/* Location Search Input (Screenshot 2) */}
            <div className="max-w-xl mx-auto text-left space-y-3 pt-2">
              <div className="flex items-center justify-between font-mono text-xs text-[#5FE3D6] font-bold uppercase tracking-wider">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#5FE3D6]/20 text-[#5FE3D6] flex items-center justify-center text-[10px]">
                    3
                  </span>
                  <span>TRAVELLING FROM</span>
                </div>
                {isSearching && (
                  <div className="flex items-center gap-1.5 text-xs text-[#5FE3D6]">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Resolving coordinates...</span>
                  </div>
                )}
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                  <Search className="w-5 h-5 text-[#5FE3D6]" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setShowDropdown(true)}
                  placeholder="Your city or country, e.g. Nagpur, Berlin, Brazil"
                  className="w-full pl-12 pr-4 py-4 bg-[#0A091E]/90 border border-white/20 rounded-2xl text-white font-mono text-sm focus:outline-none focus:border-[#5FE3D6] focus:ring-2 focus:ring-[#5FE3D6]/20 shadow-xl transition-all placeholder:text-gray-500"
                />

                {/* Autocomplete Dropdown */}
                {showDropdown && searchResults.length > 0 && (
                  <div className="absolute z-50 left-0 right-0 mt-2 bg-[#0F0D2E] border border-white/20 rounded-2xl shadow-2xl overflow-hidden divide-y divide-white/5 max-h-72 overflow-y-auto">
                    {searchResults.map((city) => (
                      <button
                        key={`${city.name}-${city.lat}`}
                        type="button"
                        onClick={() => handleSelectCity(city)}
                        className="w-full px-4 py-3.5 text-left hover:bg-white/10 flex items-center justify-between transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <MapPin className="w-4 h-4 text-[#5FE3D6] group-hover:scale-110 transition-transform" />
                          <div>
                            <div className="font-bold text-sm text-white">{city.name}</div>
                            <div className="font-mono text-xs text-gray-400">
                              {city.state ? `${city.state}, ` : ''}{city.country}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {city.capitalType && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#B59CF2]/20 text-[#B59CF2] border border-[#B59CF2]/30">
                              {city.capitalType}
                            </span>
                          )}
                          <span className="font-mono text-xs text-[#F6A067]">
                            {calculateHaversineDistance(city.lat, city.lon, MUMBAI_METADATA.lat, MUMBAI_METADATA.lon)} km
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected location confirmation info */}
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 text-xs font-mono space-y-1.5">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>
                    {selectedCity.name}, {selectedCity.state ? `${selectedCity.state}, ` : ''}{selectedCity.country} · {distanceKm} km to Mumbai
                  </span>
                </div>
                <p className="text-gray-400 text-[11px] leading-relaxed">
                  The map zooms in for trips inside India and zooms out the further you travel. Mumbai locals get a home-ground card.
                </p>
              </div>

              {/* Quick Preset Buttons */}
              <div className="pt-2">
                <div className="text-[11px] font-mono text-gray-400 mb-2">Popular departure hubs:</div>
                <div className="flex flex-wrap gap-2">
                  {quickCities.map((c) => (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => handleSelectCity(c)}
                      className={`px-3 py-1.5 rounded-xl font-mono text-xs border transition-all ${
                        selectedCity.name === c.name
                          ? 'bg-[#5FE3D6]/20 border-[#5FE3D6] text-white shadow-md'
                          : 'bg-white/5 border-white/10 text-gray-300 hover:border-white/30 hover:text-white'
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Continue to Step 2 Button */}
              <div className="pt-4">
                <button
                  type="button"
                  onClick={() => setActiveStep(2)}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#5FE3D6] via-[#B59CF2] to-[#F6A067] text-[#070920] font-heading font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl hover:opacity-95 active:scale-95 transition-all"
                >
                  <span>Continue to Travel Mode</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: CHOOSE TRAVEL MODE (FLIGHT vs TRAIN) */}
      {activeStep === 2 && (
        <div className="space-y-6">
          <div className="bg-[#12102E]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-6">
            <div className="text-center space-y-2">
              <span className="font-mono text-xs text-[#5FE3D6] font-bold uppercase tracking-wider">
                STEP 2 • TRAVEL MODE
              </span>
              <h2 className="text-2xl sm:text-3xl font-heading font-black text-white">
                How are you travelling to Devcon?
              </h2>
              <p className="font-mono text-xs text-gray-400">
                Departure from {selectedCity.name} ({distanceKm} km to Mumbai)
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
              {/* Flight Card */}
              <button
                type="button"
                onClick={() => setTravelMode('flight')}
                className={`relative overflow-hidden p-6 rounded-2xl border text-left transition-all ${
                  travelMode === 'flight'
                    ? 'bg-gradient-to-br from-[#5FE3D6]/20 via-[#18153A] to-[#0A091E] border-[#5FE3D6] shadow-xl shadow-[#5FE3D6]/20 scale-[1.02]'
                    : 'bg-[#0A091E]/70 border-white/10 hover:border-white/30 text-gray-400'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-[#5FE3D6]/20 border border-[#5FE3D6]/40 flex items-center justify-center text-[#5FE3D6]">
                    <Plane className="w-6 h-6 -rotate-45" />
                  </div>
                  {travelMode === 'flight' && (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-[#5FE3D6] text-[#070920]">
                      SELECTED
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <h3 className="font-heading font-black text-lg text-white uppercase">Flight ✈️</h3>
                  <p className="font-mono text-xs text-gray-300">Flying to Mumbai</p>
                </div>

                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-mono text-gray-400">
                  <span>Geodesic Air Path</span>
                  <span className="text-[#5FE3D6] font-bold">~{calculateEstimatedTravelTime(distanceKm, 'flight')}</span>
                </div>
              </button>

              {/* Train Card */}
              <button
                type="button"
                onClick={() => setTravelMode('train')}
                className={`relative overflow-hidden p-6 rounded-2xl border text-left transition-all ${
                  travelMode === 'train'
                    ? 'bg-gradient-to-br from-[#F6A067]/20 via-[#18153A] to-[#0A091E] border-[#F6A067] shadow-xl shadow-[#F6A067]/20 scale-[1.02]'
                    : 'bg-[#0A091E]/70 border-white/10 hover:border-white/30 text-gray-400'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-[#F6A067]/20 border border-[#F6A067]/40 flex items-center justify-center text-[#F6A067]">
                    <Train className="w-6 h-6" />
                  </div>
                  {travelMode === 'train' && (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-[#F6A067] text-[#070920]">
                      SELECTED
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <h3 className="font-heading font-black text-lg text-white uppercase">Train 🚆</h3>
                  <p className="font-mono text-xs text-gray-300">Taking the railway to Mumbai</p>
                </div>

                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-mono text-gray-400">
                  <span>Railway Track Corridor</span>
                  <span className="text-[#F6A067] font-bold">~{calculateEstimatedTravelTime(distanceKm, 'train')}</span>
                </div>
              </button>
            </div>

            {/* Launch Animation Button */}
            <div className="max-w-md mx-auto pt-4 flex gap-3">
              <button
                type="button"
                onClick={() => setActiveStep(1)}
                className="py-3.5 px-5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 font-mono text-xs uppercase"
              >
                Change Origin
              </button>

              <button
                type="button"
                onClick={() => setActiveStep(3)}
                className="flex-1 py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#5FE3D6] to-[#B59CF2] text-[#070920] font-heading font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl hover:opacity-95 active:scale-95 transition-all"
              >
                <span>Generate Geographic Route</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: LIVE CINEMATIC MAP & FINAL DEVCON 8 CARD (Screenshot 3) */}
      {activeStep === 3 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Real Geographic Map & Card Preview */}
          <div className="lg:col-span-6 lg:sticky lg:top-24 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-mono text-xs text-[#5FE3D6] uppercase tracking-wider font-bold">
                <span className="w-2 h-2 rounded-full bg-[#5FE3D6] animate-ping" />
                <span>DEVCON 8 JOURNEY CARD PREVIEW</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTravelMode(travelMode === 'flight' ? 'train' : 'flight')}
                  className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-mono flex items-center gap-1.5 transition-colors"
                  title="Toggle travel mode"
                >
                  {travelMode === 'flight' ? <Plane className="w-3.5 h-3.5 text-[#5FE3D6]" /> : <Train className="w-3.5 h-3.5 text-[#F6A067]" />}
                  <span className="capitalize">{travelMode}</span>
                </button>
              </div>
            </div>

            {/* Live Canvas Component */}
            <CardCanvas
              ref={canvasRef}
              template="journey"
              theme="night"
              handle={handle}
              displayName={displayName}
              tagline={tagline}
              message=""
              idNumber={idNumber}
              avatarImage={avatarImage}
              photoZoom={photoZoom}
              city={{
                name: selectedCity.name,
                lat: selectedCity.lat,
                lon: selectedCity.lon,
                country: selectedCity.country,
                isDomestic: selectedCity.country === 'India'
              }}
              cityMetadata={selectedCity}
              travelMode={travelMode}
            />

            {/* Telemetry Summary Pill Bar */}
            <div className="grid grid-cols-3 gap-2 text-center p-3 rounded-2xl bg-[#12102E]/80 border border-white/10">
              <div className="p-2">
                <div className="text-[10px] font-mono text-gray-400 uppercase">Distance</div>
                <div className="font-heading font-black text-sm text-white">{distanceKm} KM</div>
              </div>
              <div className="p-2 border-x border-white/10">
                <div className="text-[10px] font-mono text-gray-400 uppercase">Est. Time</div>
                <div className="font-heading font-black text-sm text-[#5FE3D6]">{durationStr}</div>
              </div>
              <div className="p-2">
                <div className="text-[10px] font-mono text-gray-400 uppercase">Timezone</div>
                <div className="font-heading font-black text-sm text-[#F6A067]">{timezoneInfo.diffStr}</div>
              </div>
            </div>
          </div>

          {/* Right Column: Journey Controls & Customizer */}
          <div className="lg:col-span-6 space-y-6">
            {/* 1. Journey Telemetry Overview Panel */}
            <div className="bg-[#12102E]/70 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-mono text-xs text-[#5FE3D6] uppercase tracking-wider font-bold">
                  <Compass className="w-4 h-4 text-[#5FE3D6]" />
                  <span>Geographic Route Telemetry</span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveStep(1)}
                  className="text-[11px] font-mono text-gray-400 hover:text-white underline"
                >
                  Change Origin
                </button>
              </div>

              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-sm text-white flex items-center gap-2">
                    <span>{selectedCity.name.toUpperCase()}</span>
                    <span className="text-[#5FE3D6]">➔</span>
                    <span>MUMBAI</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#5FE3D6]/20 text-[#5FE3D6] font-bold">
                    CALCULATED
                  </span>
                </div>

                <div className="text-xs font-mono text-gray-300 space-y-1 pt-1 border-t border-white/5">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Mode:</span>
                    <span className="text-white capitalize">{travelMode} ({travelMode === 'flight' ? 'Geodesic Flight' : 'Railway Corridor'})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Origin Timezone:</span>
                    <span className="text-white">{timezoneInfo.originStr}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Mumbai Timezone:</span>
                    <span className="text-white">{timezoneInfo.mumbaiStr}</span>
                  </div>
                </div>

                {/* States Crossed Badges */}
                <div className="pt-2 border-t border-white/5">
                  <div className="text-[10px] font-mono text-gray-400 uppercase mb-1.5">States / Regions Crossed:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {statesCrossed.map((st) => (
                      <span
                        key={st}
                        className="px-2 py-0.5 rounded bg-[#B59CF2]/20 border border-[#B59CF2]/30 text-[#B59CF2] text-[10px] font-mono font-bold"
                      >
                        {st}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Social Handle, Avatar & Custom Tagline */}
            <div className="bg-[#12102E]/70 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex items-center gap-2 font-mono text-xs text-[#5FE3D6] uppercase tracking-wider font-bold">
                <XIcon className="w-4 h-4 text-[#1DA1F2]" />
                <span>Card Personalization</span>
              </div>

              {/* Live Profile preview & Zoom Slider */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="w-12 h-12 rounded-full overflow-hidden border border-[#5FE3D6]/60 shrink-0 bg-black flex items-center justify-center">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={handle} className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-bold text-lg text-white">{(handle[0] || 'D').toUpperCase()}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white truncate">{displayName || `@${handle}`}</span>
                    <button
                      type="button"
                      onClick={() => setShowEditDisplayName(!showEditDisplayName)}
                      className="text-gray-400 hover:text-[#5FE3D6]"
                      title="Edit display name"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="font-mono text-xs text-gray-400">@{handle}</div>
                </div>
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

              {showEditDisplayName && (
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Custom display name"
                  className="w-full px-3 py-2 bg-[#0A091E] border border-[#5FE3D6]/40 rounded-lg text-white font-mono text-xs focus:outline-none"
                />
              )}

              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-mono text-gray-400 mb-1">Social Handle</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 font-mono text-sm font-bold">
                      @
                    </div>
                    <input
                      type="text"
                      value={handle}
                      onChange={(e) => setHandle(e.target.value.replace(/^@/, '').trim())}
                      placeholder="yourhandle"
                      className="w-full pl-8 pr-4 py-2.5 bg-[#0A091E] border border-white/20 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-[#5FE3D6]"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-[11px] font-mono text-gray-400">Tagline on Card</label>
                    <button
                      type="button"
                      onClick={() => setCustomTagline(!customTagline)}
                      className="text-[10px] font-mono text-gray-400 hover:text-[#5FE3D6] underline"
                    >
                      {customTagline ? 'Choose preset' : 'Write custom'}
                    </button>
                  </div>

                  {customTagline ? (
                    <input
                      type="text"
                      value={tagline}
                      onChange={(e) => setTagline(e.target.value)}
                      placeholder="Type custom tagline..."
                      className="w-full px-3 py-2 bg-[#0A091E] border border-white/20 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-[#5FE3D6]"
                    />
                  ) : (
                    <select
                      value={tagline}
                      onChange={(e) => setTagline(e.target.value)}
                      className="w-full px-3 py-2 bg-[#0A091E] border border-white/20 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-[#5FE3D6]"
                    >
                      <option value="I'm going to Devcon 8">I'm going to Devcon 8</option>
                      <option value="Building the future from Mumbai">Building the future from Mumbai</option>
                      <option value="I'm building onchain in Mumbai">I'm building onchain in Mumbai</option>
                      <option value="Connecting at Devcon 8">Connecting at Devcon 8</option>
                      <option value="Speaking at Devcon 8">Speaking at Devcon 8</option>
                      <option value="Shipping from Mumbai">Shipping from Mumbai</option>
                    </select>
                  )}
                </div>
              </div>
            </div>

            {/* 3. Export & Share Buttons */}
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={onDownloadPng}
                  className="flex items-center justify-center gap-2 py-4 px-4 rounded-xl bg-gradient-to-r from-[#5FE3D6] to-[#B59CF2] hover:opacity-95 text-[#070920] font-heading font-black text-sm uppercase tracking-wider transition-all shadow-lg shadow-[#5FE3D6]/20 active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  <span>Download PNG</span>
                </button>

                <button
                  type="button"
                  onClick={onPostX}
                  className="flex items-center justify-center gap-2 py-4 px-4 rounded-xl bg-[#1DA1F2] hover:bg-[#1a94df] text-white font-heading font-black text-sm uppercase tracking-wider transition-all shadow-lg shadow-[#1DA1F2]/20 active:scale-95"
                >
                  <XIcon className="w-4 h-4 fill-white" />
                  <span>Post to X</span>
                </button>
              </div>

              {/* Animated Flight / Train GIF Export */}
              <button
                type="button"
                onClick={onDownloadGif}
                disabled={isGeneratingGif}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#1C184E] hover:bg-[#28226E] border border-[#5FE3D6]/40 text-[#5FE3D6] font-mono text-xs font-bold uppercase transition-all"
              >
                {isGeneratingGif ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Generating Animated {travelMode === 'flight' ? 'Flight' : 'Train'} GIF... {gifProgress}%</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Export Animated {travelMode === 'flight' ? 'Flight' : 'Train'} GIF</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onShare}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 font-mono text-xs transition-all"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share Devcon 8 Journey Card</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
