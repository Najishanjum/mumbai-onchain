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
import { LatestIDsBoard } from './LatestIDsBoard';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export const IDGeneratorPage: React.FC = () => {
  const canvasRef = useRef<CardCanvasRef | null>(null);

  // Core Generator State
  const [template, setTemplate] = useState<CardTemplate>('classic');
  const [theme, setTheme] = useState<CardTheme>('night');
  const [photoZoom, setPhotoZoom] = useState<number>(1.1);
  const [tagline, setTagline] = useState<string>("I'm building onchain in Mumbai");
  const [message, setMessage] = useState<string>(
    'gm from Mumbai! Here for MumbaiOnChain. Building, learning & way too much chai.'
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
    avatarImage,
    avatarUrl,
    isLoading: isLoadingProfile
  } = useXProfile('vitalik');

  const { getIdForHandle, registerGeneratedCard, totalIds, recentRecords } = useIdManager();
  const idNumber = getIdForHandle(handle);

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
      a.download = `mumbai-onchain-${template}-${handle || 'anon'}-${idFormatted}.png`;
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
        template,
        city: template === 'journey' ? selectedCity.name : undefined,
        tagline,
        timestamp: Date.now()
      });

      showToast(`ID #${idFormatted} downloaded successfully!`);
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
      a.download = `mumbai-onchain-journey-${handle || 'anon'}-${idFormatted}.gif`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast(`Journey GIF #${idFormatted} exported!`);
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
    const caption = `I just minted my MumbaiOnChain ID! 👀\n\nMOC ID NO. ${idFormatted}\n${tagline}\n@${handle}\n\n#mumbaionchain #devcon8`;

    try {
      const blob = await canvasRef.current.exportPngBlob();
      if (blob && navigator.canShare && navigator.canShare({ files: [new File([blob], 'id.png', { type: 'image/png' })] })) {
        const file = new File([blob], `mumbai-onchain-id-${idFormatted}.png`, { type: 'image/png' });
        await navigator.share({
          files: [file],
          title: 'MumbaiOnChain ID',
          text: caption
        });
        showToast('Shared successfully!');
        return;
      }

      // Fallback text share
      if (navigator.share) {
        await navigator.share({
          title: 'MumbaiOnChain ID',
          text: caption,
          url: window.location.href
        });
        showToast('Shared successfully!');
      } else {
        // Fallback copy
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
    const tweetText = `I just generated my official MumbaiOnChain ID! 👀\n\nMOC ID NO. ${idFormatted}\n"${tagline}"\n\nMake yours at https://mumbai-onchain.vercel.app/\n\n#mumbaionchain #devcon8 #ethereum`;
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

      {/* Main Generator Workspace */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left Column: Live Card Preview (Desktop Sticky) */}
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

          {/* Right Column: Interactive Generator Controls */}
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
              avatarUrl={avatarUrl}
              isLoadingProfile={isLoadingProfile}
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

        {/* Community Board / Latest IDs */}
        <LatestIDsBoard records={recentRecords} totalCount={totalIds} />
      </main>
    </div>
  );
};
