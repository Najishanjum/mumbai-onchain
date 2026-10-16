import { useEffect, useRef, useState } from 'react';
import { Download, Loader2, Share } from 'lucide-react';
import type { PersonProfile } from '../types/person';
import { Sheet } from './ui';
import { FORMATS, renderCard, type CardFormat } from './cardImage';

const ORDER: CardFormat[] = ['wallpaper', 'post', 'badge'];
// Older browsers have no file sharing; they get a plain download instead.
const canShareFiles = 'canShare' in navigator;

/** Opens the share sheet with the image (Save Image, X, WhatsApp…), or downloads it. */
async function shareOrDownload(file: File, text: string): Promise<'shared' | 'downloaded' | 'cancelled'> {
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], text });
      return 'shared';
    } catch (e) {
      if ((e as Error).name === 'AbortError') return 'cancelled';
      // Share failed for another reason: fall through to a download.
    }
  }
  const href = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = href;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(href), 2000);
  return 'downloaded';
}

function SaveCardBody({ person, onClose }: { person: PersonProfile; onClose: () => void }) {
  const [format, setFormat] = useState<CardFormat>('wallpaper');
  const [files, setFiles] = useState<Partial<Record<CardFormat, { file: File; url: string }>>>({});
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const current = files[format];
  const filesRef = useRef(files);
  useEffect(() => {
    filesRef.current = files;
  }, [files]);

  // Draw each format the first time it's picked, and keep it.
  useEffect(() => {
    if (files[format]) return;
    let live = true;
    renderCard(person, format)
      .then((file) => live && setFiles((f) => ({ ...f, [format]: { file, url: URL.createObjectURL(file) } })))
      .catch(() => live && setNote('Couldn’t make the image. Try again.'));
    return () => {
      live = false;
    };
  }, [format, files, person]);

  useEffect(
    () => () => Object.values(filesRef.current).forEach((f) => f && URL.revokeObjectURL(f.url)),
    []
  );

  async function save() {
    if (!current) return;
    setBusy(true);
    setNote('');
    const result = await shareOrDownload(current.file, 'See you at Mumbai Onchain! Scan to connect.');
    setBusy(false);
    if (result === 'downloaded') setNote('Saved to your downloads.');
  }

  const { w, h, hint } = FORMATS[format];

  return (
    <Sheet open onClose={onClose} label="Save card">
      {/* The title flows beside the sheet's floating close button; the column
          below clears it. A flex box next to a float shrinks to make room,
          which squeezed everything to the left. */}
      <div className="px-5 pt-2">
        <h2 className="app-title text-[22px]">Save your card</h2>
        <div className="clear-both mt-4 flex flex-col gap-4">

        <div role="radiogroup" aria-label="Image type" className="grid grid-cols-3 p-1 rounded-full bg-[var(--app-segment)]">
          {ORDER.map((id) => (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={format === id}
              onClick={() => {
                setFormat(id);
                setNote('');
              }}
              className={`h-9 rounded-full text-[14px] font-bold ${
                format === id ? 'bg-[var(--app-primary)] text-[var(--app-on-primary)]' : 'text-[var(--app-muted)]'
              }`}
            >
              {FORMATS[id].label}
            </button>
          ))}
        </div>

        <div className="flex justify-center">
          <div
            className="relative rounded-2xl overflow-hidden border border-[var(--app-line)] bg-[#0A0A0C] flex items-center justify-center"
            style={{ aspectRatio: `${w} / ${h}`, height: format === 'post' ? 'auto' : 'min(46dvh, 420px)', width: format === 'post' ? '100%' : 'auto' }}
          >
            {current ? (
              <img src={current.url} alt={`${FORMATS[format].label} image of your card`} className="w-full h-full object-contain" />
            ) : (
              <Loader2 className="w-6 h-6 animate-spin text-white/70" aria-label="Making the image" />
            )}
          </div>
        </div>

        <p className="text-[14px] text-center text-[var(--app-muted)] min-h-[42px]">{note || hint}</p>

        <button
          type="button"
          onClick={save}
          disabled={!current || busy}
          className="app-press h-12 rounded-full bg-[var(--app-primary)] text-[var(--app-on-primary)] text-[16px] font-bold inline-flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {canShareFiles ? <Share className="w-5 h-5" aria-hidden="true" /> : <Download className="w-5 h-5" aria-hidden="true" />}
          {canShareFiles ? 'Save or share' : 'Download'}
        </button>
        </div>
      </div>
    </Sheet>
  );
}

/** Me/Today → Save card: the badge, a QR lock-screen wallpaper or an X post, as an image. */
export function SaveCardSheet({ person, isOpen, onClose }: { person: PersonProfile | null; isOpen: boolean; onClose: () => void }) {
  return isOpen && person ? <SaveCardBody person={person} onClose={onClose} /> : null;
}
