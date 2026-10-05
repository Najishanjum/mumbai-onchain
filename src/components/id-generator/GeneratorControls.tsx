import React, { useState } from 'react';
import {
  CardTemplate,
  CardTheme
} from './cardRenderer';
import { PRESET_CITIES, CityLocation, calculateDistanceKm, MUMBAI_COORDS } from './citiesData';
import {
  Download,
  Share2,
  Twitter,
  Copy,
  Check,
  ZoomIn,
  MapPin,
  MessageSquare,
  Sparkles,
  Layers,
  Palette,
  Loader2
} from 'lucide-react';

interface GeneratorControlsProps {
  template: CardTemplate;
  setTemplate: (t: CardTemplate) => void;
  theme: CardTheme;
  setTheme: (t: CardTheme) => void;
  handle: string;
  setHandle: (h: string) => void;
  displayName: string;
  setDisplayName: (n: string) => void;
  avatarUrl: string;
  isLoadingProfile: boolean;
  photoZoom: number;
  setPhotoZoom: (z: number) => void;
  tagline: string;
  setTagline: (t: string) => void;
  message: string;
  setMessage: (m: string) => void;
  selectedCity: CityLocation;
  setSelectedCity: (c: CityLocation) => void;
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
  "Onchain Mumbai",
  "Powered by Mumbai",
  "Building at MumbaiOnChain",
  "Exploring Mumbai's onchain ecosystem",
  "Shipping from Mumbai",
  "Connecting Mumbai onchain",
  "Learning, building & shipping",
  "Here for the MumbaiOnChain community"
];

const PRESET_MESSAGES = [
  "gm Mumbai 👋 Here for MumbaiOnChain. Building, learning & way too much chai.",
  "Building the next generation of decentralized systems from Mumbai.",
  "See you onchain at Devcon 8 Mumbai!",
  "Connecting builders, researchers & protocols across India.",
  "Made in Mumbai. Verified on Ethereum."
];

const THEMES: { id: CardTheme; label: string; color: string }[] = [
  { id: 'night', label: 'Mumbai Night', color: '#5FE3D6' },
  { id: 'marine', label: 'Marine Drive', color: '#F59E0B' },
  { id: 'gateway', label: 'Gateway', color: '#C084FC' },
  { id: 'cyber', label: 'Cyber Mumbai', color: '#00F0FF' }
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
  avatarUrl,
  isLoadingProfile,
  photoZoom,
  setPhotoZoom,
  tagline,
  setTagline,
  message,
  setMessage,
  selectedCity,
  setSelectedCity,
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

  const distanceKm = calculateDistanceKm(
    selectedCity.lat,
    selectedCity.lon,
    MUMBAI_COORDS[0],
    MUMBAI_COORDS[1]
  );

  const handleCopyCaption = () => {
    const idFormatted = idNumber ? String(idNumber).padStart(4, '0') : '----';
    const text = `I just minted my MumbaiOnChain ID! 👀\n\nMOC ID NO. ${idFormatted}\n${tagline}\n@${handle}\n\n#mumbaionchain #devcon8 #ethereum`;
    navigator.clipboard.writeText(text);
    setCopiedCaption(true);
    setTimeout(() => setCopiedCaption(false), 2000);
  };

  return (
    <div className="w-full space-y-6 text-[#E0DEF7] select-none">
      {/* 1. Template Selector */}
      <div className="bg-[#12102E]/70 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-xl space-y-3">
        <div className="flex items-center gap-2 font-mono text-xs text-[#5FE3D6] uppercase tracking-wider font-bold">
          <Layers className="w-4 h-4" />
          <span>1. Choose Card Template</span>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          {/* Mumbai Signature */}
          <button
            type="button"
            onClick={() => setTemplate('classic')}
            className={`p-3 rounded-xl border text-left transition-all ${
              template === 'classic'
                ? 'bg-[#1C184E] border-[#5FE3D6] ring-1 ring-[#5FE3D6]/50 shadow-lg shadow-[#5FE3D6]/10 text-white'
                : 'bg-white/5 border-white/10 hover:bg-white/10 text-gray-300'
            }`}
          >
            <div className="font-heading font-black text-sm uppercase">MUMBAI</div>
            <div className="font-mono text-[11px] text-gray-400 mt-0.5 line-clamp-1">Signature Pass</div>
          </button>

          {/* Postcard */}
          <button
            type="button"
            onClick={() => setTemplate('postcard')}
            className={`p-3 rounded-xl border text-left transition-all ${
              template === 'postcard'
                ? 'bg-[#1C184E] border-[#5FE3D6] ring-1 ring-[#5FE3D6]/50 shadow-lg shadow-[#5FE3D6]/10 text-white'
                : 'bg-white/5 border-white/10 hover:bg-white/10 text-gray-300'
            }`}
          >
            <div className="font-heading font-black text-sm uppercase">POSTCARD</div>
            <div className="font-mono text-[11px] text-gray-400 mt-0.5 line-clamp-1">Retro Greeting</div>
          </button>

          {/* Journey */}
          <button
            type="button"
            onClick={() => setTemplate('journey')}
            className={`p-3 rounded-xl border text-left transition-all ${
              template === 'journey'
                ? 'bg-[#1C184E] border-[#5FE3D6] ring-1 ring-[#5FE3D6]/50 shadow-lg shadow-[#5FE3D6]/10 text-white'
                : 'bg-white/5 border-white/10 hover:bg-white/10 text-gray-300'
            }`}
          >
            <div className="font-heading font-black text-sm uppercase">JOURNEY</div>
            <div className="font-mono text-[11px] text-gray-400 mt-0.5 line-clamp-1">Route & Flight</div>
          </button>
        </div>
      </div>

      {/* 2. X (Twitter) Profile Input */}
      <div className="bg-[#12102E]/70 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-mono text-xs text-[#5FE3D6] uppercase tracking-wider font-bold">
            <Twitter className="w-4 h-4 text-[#1DA1F2]" />
            <span>2. X (Twitter) Profile</span>
          </div>
          {isLoadingProfile && (
            <div className="flex items-center gap-1.5 text-xs font-mono text-[#5FE3D6]">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Fetching...</span>
            </div>
          )}
        </div>

        {/* Input box */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 font-mono text-base font-bold">
            @
          </div>
          <input
            type="text"
            value={handle}
            onChange={(e) => setHandle(e.target.value.replace(/^@/, ''))}
            placeholder="vitalik"
            className="w-full pl-8 pr-4 py-3 bg-[#0A091E] border border-white/20 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-[#5FE3D6] focus:ring-1 focus:ring-[#5FE3D6] transition-all"
          />
        </div>

        {/* Live Profile preview & Zoom Slider */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
          <div className="w-12 h-12 rounded-full overflow-hidden border border-[#5FE3D6]/60 shrink-0 bg-black flex items-center justify-center">
            {avatarUrl ? (
              <img src={avatarUrl} alt={handle} className="w-full h-full object-cover" />
            ) : (
              <span className="font-bold text-lg text-white">{(handle[0] || 'M').toUpperCase()}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-sm text-white truncate">{displayName || `@${handle}`}</div>
            <div className="font-mono text-xs text-gray-400">@{handle}</div>
          </div>
          <div className="shrink-0 flex items-center gap-2">
            <ZoomIn className="w-3.5 h-3.5 text-gray-400" />
            <input
              type="range"
              min={1}
              max={2}
              step={0.1}
              value={photoZoom}
              onChange={(e) => setPhotoZoom(parseFloat(e.target.value))}
              className="w-20 accent-[#5FE3D6] cursor-pointer"
              title={`Zoom: ${Math.round(photoZoom * 100)}%`}
            />
          </div>
        </div>

        <p className="font-mono text-[11px] text-gray-400 leading-tight">
          Public X profile information is used to personalize this card. This card does not verify identity or attendance.
        </p>
      </div>

      {/* 3. Tagline Selector */}
      <div className="bg-[#12102E]/70 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-xl space-y-3">
        <div className="flex items-center gap-2 font-mono text-xs text-[#5FE3D6] uppercase tracking-wider font-bold">
          <Sparkles className="w-4 h-4 text-[#F6A067]" />
          <span>3. Identity Tagline</span>
        </div>

        <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto pr-1">
          {PRESET_TAGLINES.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => {
                setTagline(preset);
                setCustomTaglineActive(false);
              }}
              className={`px-3 py-1.5 rounded-lg font-mono text-xs transition-all text-left ${
                tagline === preset && !customTaglineActive
                  ? 'bg-[#5FE3D6] text-[#0A091E] font-bold shadow-md'
                  : 'bg-white/5 hover:bg-white/15 text-gray-300 border border-white/5'
              }`}
            >
              {preset}
            </button>
          ))}
        </div>

        {/* Custom Tagline Option */}
        <div className="pt-2">
          <input
            type="text"
            maxLength={40}
            value={customTaglineActive ? tagline : ''}
            onFocus={() => setCustomTaglineActive(true)}
            onChange={(e) => {
              setCustomTaglineActive(true);
              setTagline(e.target.value);
            }}
            placeholder="Or type custom tagline (max 40 chars)..."
            className="w-full px-3.5 py-2.5 bg-[#0A091E] border border-white/15 rounded-xl font-mono text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#5FE3D6]"
          />
        </div>
      </div>

      {/* 4. Conditional Controls: POSTCARD MESSAGE or JOURNEY LOCATION */}
      {template === 'postcard' && (
        <div className="bg-[#12102E]/70 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-xl space-y-3 animate-fade-in">
          <div className="flex items-center gap-2 font-mono text-xs text-[#5FE3D6] uppercase tracking-wider font-bold">
            <MessageSquare className="w-4 h-4 text-[#B59CF2]" />
            <span>4. Postcard Message</span>
          </div>

          <div className="flex flex-wrap gap-1.5 pb-1">
            {PRESET_MESSAGES.map((msg, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setMessage(msg)}
                className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/15 text-[11px] font-mono text-gray-300 border border-white/5"
              >
                Preset {i + 1}
              </button>
            ))}
          </div>

          <textarea
            rows={3}
            maxLength={140}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Write your personal postcard message..."
            className="w-full p-3 bg-[#0A091E] border border-white/15 rounded-xl font-mono text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#5FE3D6]"
          />
          <div className="text-right font-mono text-[10px] text-gray-400">
            {message.length} / 140
          </div>
        </div>
      )}

      {template === 'journey' && (
        <div className="bg-[#12102E]/70 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-xl space-y-3 animate-fade-in">
          <div className="flex items-center justify-between font-mono text-xs text-[#5FE3D6] uppercase tracking-wider font-bold">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#F6A067]" />
              <span>4. Departing City</span>
            </div>
            <span className="text-white bg-[#1C184E] px-2.5 py-0.5 rounded border border-white/10">
              {distanceKm.toLocaleString()} KM TO MUMBAI
            </span>
          </div>

          <select
            value={selectedCity.name}
            onChange={(e) => {
              const found = PRESET_CITIES.find((c) => c.name === e.target.value);
              if (found) setSelectedCity(found);
            }}
            className="w-full px-3.5 py-2.5 bg-[#0A091E] border border-white/15 rounded-xl font-mono text-xs text-white focus:outline-none focus:border-[#5FE3D6]"
          >
            <optgroup label="India Cities">
              {PRESET_CITIES.filter((c) => c.isDomestic).map((city) => (
                <option key={city.name} value={city.name}>
                  {city.name} ({calculateDistanceKm(city.lat, city.lon, MUMBAI_COORDS[0], MUMBAI_COORDS[1])} km)
                </option>
              ))}
            </optgroup>
            <optgroup label="Global Hubs">
              {PRESET_CITIES.filter((c) => !c.isDomestic).map((city) => (
                <option key={city.name} value={city.name}>
                  {city.name} ({calculateDistanceKm(city.lat, city.lon, MUMBAI_COORDS[0], MUMBAI_COORDS[1])} km)
                </option>
              ))}
            </optgroup>
          </select>
        </div>
      )}

      {/* 5. Theme Palette */}
      <div className="bg-[#12102E]/70 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-2 font-mono text-xs text-[#5FE3D6] uppercase tracking-wider font-bold">
          <Palette className="w-4 h-4" />
          <span>Atmosphere</span>
        </div>

        <div className="flex items-center gap-2">
          {THEMES.map((th) => (
            <button
              key={th.id}
              type="button"
              onClick={() => setTheme(th.id)}
              className={`px-3 py-1 rounded-lg font-mono text-xs font-semibold transition-all border ${
                theme === th.id
                  ? 'bg-white/20 border-white text-white shadow'
                  : 'bg-white/5 border-transparent text-gray-400 hover:text-white'
              }`}
            >
              {th.label}
            </button>
          ))}
        </div>
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

          {/* Share or Post */}
          <button
            type="button"
            onClick={onPostX}
            className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-[#1DA1F2] hover:bg-[#1a94df] text-white font-heading font-black text-sm uppercase tracking-wide transition-all shadow-lg shadow-[#1DA1F2]/20 active:scale-95"
          >
            <Twitter className="w-4 h-4 fill-white" />
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

        <div className="grid grid-cols-2 gap-3">
          {/* Web Share */}
          <button
            type="button"
            onClick={onShare}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-mono text-xs font-bold transition-all"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share Card</span>
          </button>

          {/* Copy Caption */}
          <button
            type="button"
            onClick={handleCopyCaption}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-mono text-xs font-bold transition-all"
          >
            {copiedCaption ? (
              <>
                <Check className="w-3.5 h-3.5 text-green-400" />
                <span className="text-green-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Caption</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
