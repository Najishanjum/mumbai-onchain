import React, { useState, useRef } from 'react';
import type { CardTemplate, CardTheme } from './cardRenderer';
import { PRESET_CITIES } from './citiesData';
import type { CityLocation } from './citiesData';
import { useXProfile } from './useXProfile';
import { useIdManager } from './useIdManager';
import { IDHero } from './IDHero';
import { CardCanvas } from './CardCanvas';
import type { CardCanvasRef } from './CardCanvas';
import { GeneratorControls } from './GeneratorControls';
import { JourneyExperience } from './JourneyExperience';
import { LatestIDsBoard } from './LatestIDsBoard';
import { CheckCircle2, AlertCircle, Compass, Layers } from 'lucide-react';

export const IDGeneratorPage: React.FC = () => {
  const canvasRef = useRef<CardCanvasRef | null>(null);

  // View Mode: 'journey-interactive' vs 'classic-studio'
  const [viewMode, setViewMode] = useState<'journey-interactive' | 'classic-studio'>('journey-interactive');

  // Core Studio State
  const [template, setTemplate] = useState<CardTemplate>('journey');
  const [theme, setTheme] = useState<CardTheme>('night');
  const [photoZoom, setPhotoZoom] = useState<number>(1.1);
  const [tagline, setTagline] = useState<string>("I'm going to Devcon 8");
  const [message, setMessage] = useState<string>(
    'gm from Mumbai! Here for Devcon 8. Building, learning & way too much chai.'
  );
  const [selectedCity, setSelectedCity] = useState<CityLocation>(PRESET_CITIES[0]); // Jabalpur by default

  // Export State
  const [isGeneratingGif, setIsGeneratingGif] = useState<boolean>(false);
  const [gifProgress, setGifProgress] = useState<number>(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  // Hooks for X Profile & Permanent IDs
  const {
    handle,
    setHandle,
    displayName,
    setDisplayName,
    xUserId,
    bio,
    location,
    avatarImage,
    avatarUrl,
    isLoading: isLoadingProfile,
    isSuccess: isProfileSuccess,
    errorMessage: profileErrorMessage,
    fetchProfile
  } = useXProfile('vitalik');

  const { getIdForProfile, registerGeneratedCard, totalIds, recentRecords } = useIdManager();
  const idNumber = getIdForProfile(xUserId, handle);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. Download PNG
  const handleDownloadPng = async () => {
    if (!canvasRef.current) return;
    try {
      const blob = await canvasRef.current.exportPngBlob();
      if (!blob) throw new Error('Could not export canvas');

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const idFormatted = idNumber ? String(idNumber).padStart(4, '0') : '0000';
      a.href = url;
      a.download = `devcon8-journey-${handle || 'anon'}-${idFormatted}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Register to community board
      registerGeneratedCard({
        id: idNumber,
        handle: handle || 'anon',
        displayName: displayName || `@${handle}`,
        avatarUrl: avatarUrl || '',
        template: 'journey',
        city: selectedCity.name,
        tagline,
        timestamp: Date.now()
      });

      showToast(`Devcon 8 ID #${idFormatted} downloaded successfully!`);
    } catch (e) {
      console.error(e);
      showToast('Export failed. Please check browser permissions.', 'error');
    }
  };

  // 2. Download Animated GIF (Journey)
  const handleDownloadGif = async () => {
    if (!canvasRef.current) return;
    setIsGeneratingGif(true);
    setGifProgress(0);

    try {
      const blob = await canvasRef.current.exportGifBlob((p) => setGifProgress(p));
      if (!blob) throw new Error('Could not generate GIF');

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const idFormatted = idNumber ? String(idNumber).padStart(4, '0') : '0000';
      a.href = url;
      a.download = `devcon8-journey-${handle || 'anon'}-${idFormatted}.gif`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast(`Animated Journey GIF #${idFormatted} exported!`);
    } catch (e) {
      console.error(e);
      showToast('GIF export failed. Try downloading PNG instead.', 'error');
    } finally {
      setIsGeneratingGif(false);
      setGifProgress(0);
    }
  };

  // 3. Web Share API
  const handleShare = async () => {
    if (!canvasRef.current) return;
    const idFormatted = idNumber ? String(idNumber).padStart(4, '0') : '0000';
    const caption = `I'm going to Devcon 8 in Mumbai! ✈️🚆\n\nMOC ID NO. ${idFormatted}\n${tagline}\n@${handle}\n\n#Devcon8 #MumbaiOnChain #Ethereum`;

    try {
      const blob = await canvasRef.current.exportPngBlob();
      if (blob && navigator.canShare && navigator.canShare({ files: [new File([blob], 'devcon8-id.png', { type: 'image/png' })] })) {
        const file = new File([blob], `devcon8-id-${idFormatted}.png`, { type: 'image/png' });
        await navigator.share({
          files: [file],
          title: 'Devcon 8 Journey ID',
          text: caption
        });
        showToast('Shared successfully!');
        return;
      }

      // Fallback text share
      if (navigator.share) {
        await navigator.share({
          title: 'Devcon 8 Journey ID',
          text: caption,
          url: window.location.href
        });
        showToast('Shared successfully!');
      } else {
        navigator.clipboard.writeText(caption);
        showToast('Caption copied to clipboard!');
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        showToast('Sharing not supported on this browser. Try Download PNG.', 'error');
      }
    }
  };

  // 4. Post to X
  const handlePostX = () => {
    const idFormatted = idNumber ? String(idNumber).padStart(4, '0') : '0000';
    const tweetText = `I just generated my official Journey to Devcon 8 card! ✈️🚆\n\nMOC ID NO. ${idFormatted}\n"${tagline}"\n\nMake yours at https://mumbaionchain.xyz\n\n#Devcon8 #MumbaiOnChain #Ethereum`;
    const intentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
    window.open(intentUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen bg-[#070617] text-[#FFF8F0] relative overflow-hidden pb-20">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 animate-bounce">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-md border ${
              toastType === 'success'
                ? 'bg-[#18153A]/90 border-[#5FE3D6] text-[#5FE3D6]'
                : 'bg-[#3A1515]/90 border-[#EF4444] text-[#EF4444]'
            }`}
          >
            {toastType === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span className="font-mono text-xs font-bold">{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Hero Header */}
      <IDHero />

      {/* Mode Switcher Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="flex items-center justify-center">
          <div className="inline-flex p-1.5 rounded-2xl bg-[#12102E]/90 border border-white/10 shadow-xl">
            <button
              type="button"
              onClick={() => {
                setViewMode('journey-interactive');
                setTemplate('journey');
              }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-heading font-black text-xs uppercase tracking-wider transition-all ${
                viewMode === 'journey-interactive'
                  ? 'bg-gradient-to-r from-[#5FE3D6] to-[#B59CF2] text-[#070920] shadow-lg shadow-[#5FE3D6]/20'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>✈️🚆 Journey to Devcon 8 (Interactive Real Map)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setViewMode('classic-studio');
                setTemplate('classic');
              }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-heading font-black text-xs uppercase tracking-wider transition-all ${
                viewMode === 'classic-studio'
                  ? 'bg-gradient-to-r from-[#B59CF2] to-[#F6A067] text-[#070920] shadow-lg shadow-[#B59CF2]/20'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>✨ Classic & Postcard Studio</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Experience Workspace */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {viewMode === 'journey-interactive' ? (
          <JourneyExperience
            handle={handle}
            setHandle={setHandle}
            displayName={displayName}
            setDisplayName={setDisplayName}
            avatarUrl={avatarUrl}
            avatarImage={avatarImage}
            idNumber={idNumber}
            onDownloadPng={handleDownloadPng}
            onDownloadGif={handleDownloadGif}
            isGeneratingGif={isGeneratingGif}
            gifProgress={gifProgress}
            onShare={handleShare}
            onPostX={handlePostX}
            canvasRef={canvasRef}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            {/* Left Column: Live Card Preview */}
            <div className="lg:col-span-6 lg:sticky lg:top-24 space-y-4">
              <div className="text-center sm:text-left mb-2">
                <span className="font-mono text-xs text-[#5FE3D6] font-bold uppercase tracking-widest block">
                  ● LIVE CARD PREVIEW
                </span>
                <span className="font-mono text-xs text-gray-400">
                  100% Canvas Rendered • High DPI Vector Output
                </span>
              </div>

              <CardCanvas
                ref={canvasRef}
                template={template}
                theme={theme}
                handle={handle}
                displayName={displayName}
                tagline={tagline}
                message={message}
                idNumber={idNumber}
                avatarImage={avatarImage}
                photoZoom={photoZoom}
                city={selectedCity}
              />

              <div className="text-center font-mono text-[11px] text-gray-500 pt-1">
                Changes update immediately in real-time. Click Download PNG or Post to X when ready.
              </div>
            </div>

            {/* Right Column: Controls */}
            <div className="lg:col-span-6">
              <GeneratorControls
                template={template}
                setTemplate={setTemplate}
                theme={theme}
                setTheme={setTheme}
                handle={handle}
                setHandle={setHandle}
                displayName={displayName}
                setDisplayName={setDisplayName}
                bio={bio}
                location={location}
                avatarUrl={avatarUrl}
                isLoadingProfile={isLoadingProfile}
                isProfileSuccess={isProfileSuccess}
                profileErrorMessage={profileErrorMessage}
                onFetchProfile={() => fetchProfile()}
                photoZoom={photoZoom}
                setPhotoZoom={setPhotoZoom}
                tagline={tagline}
                setTagline={setTagline}
                message={message}
                setMessage={setMessage}
                selectedCity={selectedCity}
                setSelectedCity={setSelectedCity}
                idNumber={idNumber}
                onDownloadPng={handleDownloadPng}
                onDownloadGif={handleDownloadGif}
                isGeneratingGif={isGeneratingGif}
                gifProgress={gifProgress}
                onShare={handleShare}
                onPostX={handlePostX}
              />
            </div>
          </div>
        )}

        {/* Community Board / Latest IDs */}
        <LatestIDsBoard records={recentRecords} totalCount={totalIds} />
      </main>
    </div>
  );
};
