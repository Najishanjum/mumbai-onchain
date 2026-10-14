import React, { useCallback, useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { AtSign, Check, ImageUp, RefreshCw, SwitchCamera, UserPlus, X } from 'lucide-react';
import type { ConnectionStatus, PersonProfile } from '../types/person';
import { PersonAvatar } from '../components/PersonAvatar';
import { findPersonFromQr } from './qr';

interface ScannerSheetProps {
  isOpen: boolean;
  onClose: () => void;
  people: PersonProfile[];
  getConnectionStatus: (id: string) => ConnectionStatus;
  onAdd: (id: string) => void;
  onOpenPerson: (id: string) => void;
}

type Result = { raw: string; person: PersonProfile | null };

// Decoding a downscaled frame ~8 times a second finds codes just as fast as
// full-resolution every frame, at a fraction of the battery.
const DECODE_WIDTH = 480;
const DECODE_INTERVAL_MS = 120;

function decode(source: CanvasImageSource, w: number, h: number, canvas: HTMLCanvasElement): string | null {
  const scale = Math.min(1, DECODE_WIDTH / w);
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  return jsQR(img.data, img.width, img.height, { inversionAttempts: 'attemptBoth' })?.data ?? null;
}

function Scanner({ onClose, people, getConnectionStatus, onAdd, onOpenPerson }: Omit<ScannerSheetProps, 'isOpen'>) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvas = () => (canvasRef.current ??= document.createElement('canvas'));
  const fileRef = useRef<HTMLInputElement>(null);
  const [facing, setFacing] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [manual, setManual] = useState(false);
  const [query, setQuery] = useState('');
  const [hint, setHint] = useState<string | null>(null);

  const resolve = useCallback((raw: string) => {
    setResult({ raw, person: findPersonFromQr(raw, people) });
    navigator.vibrate?.(40);
  }, [people]);

  // Camera runs only while there's no result on screen.
  useEffect(() => {
    if (result || manual) return;
    let stream: MediaStream | null = null;
    let timer: number | undefined;
    let cancelled = false;

    (async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error('unsupported');
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: facing }, audio: false });
        if (cancelled) return stream.getTracks().forEach((t) => t.stop());
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play();
        setCameraError(null);
        timer = window.setInterval(() => {
          if (video.readyState < video.HAVE_ENOUGH_DATA) return;
          const data = decode(video, video.videoWidth, video.videoHeight, canvas());
          if (data) resolve(data);
        }, DECODE_INTERVAL_MS);
      } catch (err) {
        const name = (err as { name?: string })?.name;
        setCameraError(
          name === 'NotAllowedError'
            ? 'Camera access is off. Allow it in Settings, or choose a photo of the pass instead.'
            : 'The camera isn’t available here. Choose a photo of the pass instead.'
        );
      }
    })();

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [facing, result, manual, resolve]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  function fromPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const data = decode(img, img.naturalWidth, img.naturalHeight, canvas());
      URL.revokeObjectURL(url);
      if (data) resolve(data);
      else setHint('No QR code found in that photo. Try a sharper screenshot of the pass.');
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      setHint('Couldn’t open that image.');
    };
    img.src = url;
  }

  const person = result?.person;
  const added = person ? getConnectionStatus(person.id) === 'CONNECTED' : false;
  const isLink = result && /^https?:\/\//i.test(result.raw);

  return (
    <div className="app fixed inset-0 z-[80] bg-black text-white flex flex-col" role="dialog" aria-modal="true" aria-label="Scan a pass">
      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-4 pt-[calc(env(safe-area-inset-top)+12px)] pb-3">
        <button type="button" onClick={onClose} aria-label="Close" className="app-press w-10 h-10 rounded-full bg-white/15 flex items-center justify-center">
          <X className="w-5 h-5" />
        </button>
        <span className="text-[17px] font-semibold">Scan a pass</span>
        <button
          type="button"
          onClick={() => setFacing((f) => (f === 'environment' ? 'user' : 'environment'))}
          aria-label="Switch camera"
          className="app-press w-10 h-10 rounded-full bg-white/15 flex items-center justify-center"
        >
          <SwitchCamera className="w-5 h-5" />
        </button>
      </div>

      {/* Camera */}
      <div className="relative flex-1 overflow-hidden">
        {!result && !manual && (
          <>
            <video ref={videoRef} playsInline muted className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <div className="w-[68vw] max-w-[280px] aspect-square rounded-[28px] border-[3px] border-white/90 shadow-[0_0_0_200vmax_rgba(0,0,0,0.45)]" />
              <p className="mt-6 text-[16px] font-medium text-white/90">Point at someone’s pass</p>
            </div>
          </>
        )}

        {cameraError && !result && !manual && (
          <div className="absolute inset-x-6 top-1/2 -translate-y-1/2 text-center">
            <p className="text-[16px] leading-relaxed text-white/90">{cameraError}</p>
          </div>
        )}

        {manual && !result && (
          <form
            className="absolute inset-x-5 top-8"
            onSubmit={(e) => {
              e.preventDefault();
              if (query.trim()) resolve(query.trim());
            }}
          >
            <label htmlFor="scan-manual" className="block text-[15px] text-white/80 mb-2">
              Their X or Telegram handle, or their name
            </label>
            <div className="flex gap-2">
              <input
                id="scan-manual"
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="@handle"
                autoCapitalize="none"
                autoCorrect="off"
                className="flex-1 h-12 px-4 rounded-xl bg-white/10 border border-white/20 text-[16px] text-white outline-none placeholder:text-white/40"
              />
              <button type="submit" className="app-press h-12 px-5 rounded-xl bg-white text-black text-[15px] font-semibold">
                Find
              </button>
            </div>
          </form>
        )}

        {/* Result card */}
        {result && (
          <div className="absolute inset-x-4 bottom-4 rounded-3xl bg-[var(--app-surface)] text-[var(--app-ink)] p-5">
            {person ? (
              <>
                <div className="flex items-center gap-3">
                  <PersonAvatar name={person.name} avatarUrl={person.avatar} size="md" className="rounded-full! border-0! w-14! h-14!" />
                  <div className="min-w-0">
                    <div className="app-title text-[20px] font-bold truncate">{person.name}</div>
                    <div className="text-[14px] text-[var(--app-muted)] truncate">
                      {person.headline || [person.category, person.city].filter(Boolean).join(' · ')}
                    </div>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => onAdd(person.id)}
                    disabled={added}
                    className="app-press h-12 rounded-full bg-[var(--app-primary)] text-[var(--app-on-primary)] text-[15px] font-semibold inline-flex items-center justify-center gap-2 disabled:bg-[var(--app-bg)] disabled:text-[var(--app-muted)]"
                  >
                    {added ? <Check className="w-[18px] h-[18px]" /> : <UserPlus className="w-[18px] h-[18px]" />}
                    {added ? 'Added' : 'Add'}
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenPerson(person.id)}
                    className="app-press h-12 rounded-full bg-[var(--app-bg)] text-[15px] font-semibold"
                  >
                    View profile
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="text-[17px] font-semibold">Not a Mumbai Onchain pass</div>
                <p className="mt-1 text-[14px] text-[var(--app-muted)] break-all line-clamp-3">{result.raw}</p>
                {isLink && (
                  <a
                    href={result.raw}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-block text-[15px] font-medium text-[var(--app-saved)]"
                  >
                    Open this link
                  </a>
                )}
              </>
            )}
            <button
              type="button"
              onClick={() => {
                setResult(null);
                setHint(null);
              }}
              className="mt-3 w-full h-11 text-[15px] font-medium text-[var(--app-saved)] inline-flex items-center justify-center gap-1.5"
            >
              <RefreshCw className="w-4 h-4" aria-hidden="true" /> Scan another
            </button>
          </div>
        )}
      </div>

      {/* Bottom tools */}
      {!result && (
        <div className="px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+16px)]">
          {hint && <p className="mb-3 text-center text-[14px] text-white/80">{hint}</p>}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={fromPhoto} />
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="app-press h-12 rounded-full bg-white/15 text-[15px] font-semibold inline-flex items-center justify-center gap-2"
            >
              <ImageUp className="w-[18px] h-[18px]" aria-hidden="true" /> Choose photo
            </button>
            <button
              type="button"
              onClick={() => setManual((m) => !m)}
              className="app-press h-12 rounded-full bg-white/15 text-[15px] font-semibold inline-flex items-center justify-center gap-2"
            >
              <AtSign className="w-[18px] h-[18px]" aria-hidden="true" /> {manual ? 'Use camera' : 'Type a handle'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export const ScannerSheet: React.FC<ScannerSheetProps> = ({ isOpen, ...rest }) => (isOpen ? <Scanner {...rest} /> : null);
