import React, { useState, useEffect, useRef } from 'react';
import jsQR from 'jsqr';
import type { PersonProfile, ConnectionStatus } from '../types/person';
import { PersonAvatar } from './PersonAvatar';
import {
  X,
  Camera,
  Upload,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  MapPin,
  UserCheck,
  Plus,
  ArrowRight,
  SwitchCamera
} from 'lucide-react';

interface ProfileScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  people: PersonProfile[];
  onSelectPerson: (personId: string) => void;
  onCycleConnection: (personId: string) => void;
  getConnectionStatus: (personId: string) => ConnectionStatus;
}

export const ProfileScannerModal: React.FC<ProfileScannerModalProps> = ({
  isOpen,
  onClose,
  people,
  onSelectPerson,
  onCycleConnection,
  getConnectionStatus,
}) => {
  const [activeTab, setActiveTab] = useState<'camera' | 'upload' | 'manual'>('camera');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [scannedResult, setScannedResult] = useState<{
    rawText: string;
    person: PersonProfile | null;
  } | null>(null);
  const [manualQuery, setManualQuery] = useState('');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // Parse QR content to find a matching person in directory
  const parseQrData = (data: string): PersonProfile | null => {
    try {
      // 1. Check if URL with person parameter: ?person=xyz or &person=xyz
      if (data.includes('person=')) {
        const match = data.match(/[?&]person=([^&#]+)/);
        if (match && match[1]) {
          const personId = decodeURIComponent(match[1]);
          const found = people.find(p => p.id === personId);
          if (found) return found;
        }
      }

      // 2. Check if raw person ID directly matches
      const byId = people.find(p => p.id === data.trim());
      if (byId) return byId;

      // 3. Check if handle matches
      const cleanData = data.trim().replace(/^@/, '').toLowerCase();
      const byHandle = people.find(
        p => (p.xHandle && p.xHandle.toLowerCase() === cleanData) ||
             (p.telegramHandle && p.telegramHandle.toLowerCase() === cleanData) ||
             (p.name && p.name.toLowerCase() === cleanData)
      );
      if (byHandle) return byHandle;

      // 4. Try JSON parse in case of rich onchain card
      if (data.startsWith('{') && data.endsWith('}')) {
        const parsed = JSON.parse(data);
        if (parsed.id) {
          const byJsonId = people.find(p => p.id === parsed.id);
          if (byJsonId) return byJsonId;
        }
        if (parsed.name) {
          const byJsonName = people.find(p => p.name.toLowerCase() === parsed.name.toLowerCase());
          if (byJsonName) return byJsonName;
        }
      }
    } catch (e) {
      console.error('Error parsing QR data:', e);
    }
    return null;
  };

  // Start Camera Stream
  const startCamera = async () => {
    stopCamera();
    setCameraError(null);
    setIsScanning(true);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access not supported by your browser.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true'); // For iOS Safari
        await videoRef.current.play();
        requestScanFrame();
      }
    } catch (err: any) {
      console.error('Camera stream error:', err);
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Camera permission denied. Please allow camera access in browser settings, or use the "Upload QR" tab.'
          : err.message || 'Unable to access camera.'
      );
      setIsScanning(false);
    }
  };

  // Stop Camera Stream
  const stopCamera = () => {
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  // Continuous frame analysis loop
  const requestScanFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert'
      });

      if (code && code.data) {
        const found = parseQrData(code.data);
        setScannedResult({
          rawText: code.data,
          person: found
        });
        stopCamera();
        return;
      }
    }

    animFrameIdRef.current = requestAnimationFrame(requestScanFrame);
  };

  // Manage Camera on open / tab change
  useEffect(() => {
    if (isOpen && activeTab === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, activeTab, facingMode]);

  // Image Upload Scanner Handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code && code.data) {
          const found = parseQrData(code.data);
          setScannedResult({
            rawText: code.data,
            person: found
          });
        } else {
          alert('No readable QR code found in this image. Please try a clearer screenshot.');
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualQuery.trim()) return;
    const found = parseQrData(manualQuery.trim());
    setScannedResult({
      rawText: manualQuery.trim(),
      person: found
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-none animate-in fade-in duration-200">
      {/* Backdrop */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Main Scanner Dialog */}
      <div className="relative w-full max-w-lg bg-[#FFFFFF] border-2 border-[#000000] shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] z-10 overflow-hidden my-8">
        
        {/* Header */}
        <div className="bg-[#000000] text-[#FFFFFF] p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-[#22C55E]" />
            <span className="font-mono text-xs font-black uppercase tracking-wider">
              PROFILE QR SCANNER // INSTANT CONNECT
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[#FFFFFF] hover:text-[#000000] text-[#FFFFFF] transition-colors border border-transparent hover:border-[#000000]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="grid grid-cols-3 border-b-2 border-[#000000] font-mono text-xs font-bold bg-[#F5F5F5]">
          <button
            type="button"
            onClick={() => {
              setScannedResult(null);
              setActiveTab('camera');
            }}
            className={`py-3 px-2 flex items-center justify-center gap-1.5 transition-colors border-r border-[#000000] ${
              activeTab === 'camera' ? 'bg-[#FFFFFF] text-[#000000] border-b-2 border-b-transparent' : 'text-[#666666] hover:text-[#000000]'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>CAMERA SCAN</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setScannedResult(null);
              setActiveTab('upload');
            }}
            className={`py-3 px-2 flex items-center justify-center gap-1.5 transition-colors border-r border-[#000000] ${
              activeTab === 'upload' ? 'bg-[#FFFFFF] text-[#000000] border-b-2 border-b-transparent' : 'text-[#666666] hover:text-[#000000]'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>UPLOAD QR</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setScannedResult(null);
              setActiveTab('manual');
            }}
            className={`py-3 px-2 flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === 'manual' ? 'bg-[#FFFFFF] text-[#000000] border-b-2 border-b-transparent' : 'text-[#666666] hover:text-[#000000]'
            }`}
          >
            <span>SEARCH / LINK</span>
          </button>
        </div>

        {/* Scanner Content */}
        <div className="p-6 space-y-6">

          {/* Success Scan Result Display */}
          {scannedResult ? (
            <div className="space-y-4 animate-in zoom-in-95 duration-200">
              <div className="p-3 bg-[#F0FDF4] border-2 border-[#15803D] flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#15803D] font-mono text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>PROFILE QR SCANNED SUCCESSFULLY</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setScannedResult(null);
                    if (activeTab === 'camera') startCamera();
                  }}
                  className="font-mono text-[11px] underline text-[#15803D] hover:text-[#000000] flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Scan Another</span>
                </button>
              </div>

              {scannedResult.person ? (
                <div className="border-2 border-[#000000] p-5 bg-[#FAFAFA] space-y-4">
                  {/* Person Header */}
                  <div className="flex items-center gap-3.5 border-b border-[#E0E0E0] pb-4">
                    <PersonAvatar
                      name={scannedResult.person.name}
                      avatarUrl={scannedResult.person.avatar}
                      size="lg"
                      className="border-2 border-[#000000]"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-heading font-black text-xl text-[#000000] truncate">
                          {scannedResult.person.name}
                        </h4>
                        <span className="font-mono text-[10px] font-bold px-2 py-0.5 bg-[#000000] text-[#FFFFFF] uppercase">
                          {scannedResult.person.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 font-mono text-xs text-[#555555] mt-0.5">
                        <MapPin className="w-3 h-3 text-[#000000] shrink-0" />
                        <span>{scannedResult.person.city}</span>
                        <span>•</span>
                        <span>{scannedResult.person.attendingEvents.length} Events Attending</span>
                      </div>
                    </div>
                  </div>

                  {/* Bio */}
                  <p className="font-sans text-xs text-[#333333] leading-relaxed line-clamp-2">
                    {scannedResult.person.bio || 'Attending Mumbai Onchain Week 2026.'}
                  </p>

                  {/* Social Accounts direct links */}
                  <div className="space-y-1.5 pt-1">
                    <div className="font-mono text-[10px] font-bold text-[#777777] uppercase">
                      Direct Social Links:
                    </div>
                    <div className="flex flex-wrap gap-2 font-mono text-xs">
                      {scannedResult.person.xHandle && (
                        <a
                          href={`https://x.com/${scannedResult.person.xHandle.replace('@', '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 bg-[#000000] text-[#FFFFFF] flex items-center gap-1 font-bold hover:bg-[#222222]"
                        >
                          <span>𝕏 @{scannedResult.person.xHandle.replace('@', '')}</span>
                          <ExternalLink className="w-3 h-3 opacity-70" />
                        </a>
                      )}
                      {scannedResult.person.githubUrl && (
                        <a
                          href={scannedResult.person.githubUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 border border-[#000000] bg-[#FFFFFF] flex items-center gap-1 font-bold hover:bg-[#000000] hover:text-[#FFFFFF]"
                        >
                          <span>GitHub</span>
                          <ExternalLink className="w-3 h-3 opacity-70" />
                        </a>
                      )}
                      {scannedResult.person.telegramHandle && (
                        <a
                          href={`https://t.me/${scannedResult.person.telegramHandle.replace('@', '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 bg-[#229ED9] text-[#FFFFFF] flex items-center gap-1 font-bold hover:opacity-90"
                        >
                          <span>Telegram</span>
                          <ExternalLink className="w-3 h-3 opacity-70" />
                        </a>
                      )}
                      {scannedResult.person.linkedinUrl && (
                        <a
                          href={scannedResult.person.linkedinUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 bg-[#0077B5] text-[#FFFFFF] flex items-center gap-1 font-bold hover:opacity-90"
                        >
                          <span>LinkedIn</span>
                          <ExternalLink className="w-3 h-3 opacity-70" />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#E0E0E0]">
                    <button
                      type="button"
                      onClick={() => onCycleConnection(scannedResult.person!.id)}
                      className={`flex items-center justify-center gap-1.5 py-2.5 px-3 font-mono text-xs font-bold border transition-colors ${
                        getConnectionStatus(scannedResult.person.id) === 'CONNECTED'
                          ? 'bg-[#15803D] border-[#15803D] text-[#FFFFFF]'
                          : getConnectionStatus(scannedResult.person.id) === 'REQUESTED'
                          ? 'bg-[#D97706] border-[#D97706] text-[#FFFFFF]'
                          : 'bg-[#000000] border-[#000000] text-[#FFFFFF] hover:bg-[#222222]'
                      }`}
                    >
                      {getConnectionStatus(scannedResult.person.id) === 'CONNECTED' ? (
                        <>
                          <UserCheck className="w-4 h-4" />
                          <span>CONNECTED</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          <span>CONNECT NOW</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onSelectPerson(scannedResult.person!.id);
                        onClose();
                      }}
                      className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-[#FFFFFF] hover:bg-[#000000] hover:text-[#FFFFFF] text-[#000000] border-2 border-[#000000] font-mono text-xs font-black transition-colors"
                    >
                      <span>VIEW FULL PROFILE</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="border border-[#000000] p-4 bg-[#FAFAFA] space-y-2">
                  <div className="font-mono text-xs font-bold text-[#000000]">
                    RAW SCANNED CONTENT:
                  </div>
                  <div className="p-3 bg-[#FFFFFF] border border-[#CCCCCC] font-mono text-xs break-all">
                    {scannedResult.rawText}
                  </div>
                  {scannedResult.rawText.startsWith('http') && (
                    <a
                      href={scannedResult.rawText}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 mt-2 bg-[#000000] text-[#FFFFFF] px-4 py-2 font-mono text-xs font-bold hover:bg-[#222222]"
                    >
                      <span>OPEN SCANNED LINK</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Active Tab: Live Camera Scanner */}
              {activeTab === 'camera' && (
                <div className="space-y-4">
                  <div className="relative bg-[#000000] border-2 border-[#000000] rounded-none overflow-hidden aspect-video flex items-center justify-center">
                    <video
                      ref={videoRef}
                      className="w-full h-full object-cover"
                    />
                    <canvas ref={canvasRef} className="hidden" />

                    {/* Laser Scanning Grid Overlay */}
                    {isScanning && !cameraError && (
                      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                        <div className="w-48 h-48 sm:w-56 sm:h-56 border-2 border-[#22C55E] relative shadow-[0_0_20px_rgba(34,197,94,0.4)]">
                          {/* Corner Markers */}
                          <div className="absolute -top-1 -left-1 w-4 h-4 border-t-4 border-l-4 border-[#22C55E]" />
                          <div className="absolute -top-1 -right-1 w-4 h-4 border-t-4 border-r-4 border-[#22C55E]" />
                          <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-4 border-l-4 border-[#22C55E]" />
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-4 border-r-4 border-[#22C55E]" />
                          
                          {/* Moving Scanning Laser */}
                          <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-[#22C55E] to-transparent shadow-[0_0_10px_#22C55E] animate-bounce duration-1000 mt-20" />
                        </div>
                      </div>
                    )}

                    {cameraError && (
                      <div className="absolute inset-0 bg-[#000000]/90 p-6 flex flex-col items-center justify-center text-center text-[#FFFFFF] space-y-3">
                        <AlertCircle className="w-8 h-8 text-[#EF4444]" />
                        <div className="font-mono text-xs text-[#EF4444] font-bold">
                          {cameraError}
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveTab('upload')}
                          className="px-4 py-2 bg-[#FFFFFF] text-[#000000] font-mono text-xs font-bold hover:bg-[#EAEAEA]"
                        >
                          SWITCH TO UPLOAD QR
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Camera Controls bar */}
                  <div className="flex items-center justify-between font-mono text-xs">
                    <div className="text-[#666666] flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
                      <span>Point camera at any attendee's QR Pass</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setFacingMode(facingMode === 'environment' ? 'user' : 'environment')}
                      className="p-1.5 border border-[#000000] bg-[#FAFAFA] hover:bg-[#000000] hover:text-[#FFFFFF] transition-colors flex items-center gap-1 font-bold"
                    >
                      <SwitchCamera className="w-3.5 h-3.5" />
                      <span>Switch Camera</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Active Tab: Upload QR File / Screenshot */}
              {activeTab === 'upload' && (
                <div className="space-y-4">
                  <label className="border-2 border-dashed border-[#000000] bg-[#FAFAFA] hover:bg-[#F0F0F0] p-8 flex flex-col items-center justify-center cursor-pointer transition-colors text-center space-y-2 group">
                    <Upload className="w-8 h-8 text-[#000000] group-hover:scale-110 transition-transform" />
                    <span className="font-heading font-black text-sm text-[#000000] uppercase">
                      CLICK TO UPLOAD QR CODE IMAGE / SCREENSHOT
                    </span>
                    <span className="font-mono text-[11px] text-[#666666]">
                      Supports PNG, JPG, WEBP, or scanned badge photos
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              )}

              {/* Active Tab: Manual Search / Paste Profile URL */}
              {activeTab === 'manual' && (
                <form onSubmit={handleManualSearch} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="font-mono text-xs font-bold text-[#000000] uppercase">
                      Enter Profile Link, X Handle, or Person ID:
                    </label>
                    <input
                      type="text"
                      value={manualQuery}
                      onChange={(e) => setManualQuery(e.target.value)}
                      placeholder="e.g. @aarav_zk or aarav.eth or https://.../?person=person-aarav-patel"
                      className="w-full p-3 border-2 border-[#000000] font-mono text-xs focus:outline-none focus:ring-1 focus:ring-[#000000]"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-[#000000] text-[#FFFFFF] font-heading font-black text-xs uppercase hover:bg-[#222222] transition-colors"
                  >
                    SEARCH & CONNECT PROFILE
                  </button>
                </form>
              )}
            </>
          )}

        </div>

        {/* Footer */}
        <div className="bg-[#FAFAFA] border-t border-[#000000] p-3 px-6 flex items-center justify-between font-mono text-[10px] text-[#777777]">
          <span>MUMBAI ONCHAIN // QR SCANNER</span>
          <button
            type="button"
            onClick={onClose}
            className="text-[#000000] font-bold hover:underline"
          >
            [CLOSE]
          </button>
        </div>
      </div>
    </div>
  );
};
