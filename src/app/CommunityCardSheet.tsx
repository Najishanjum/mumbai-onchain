import { useEffect, useRef, useState } from 'react';
import { Download, Loader2, Share } from 'lucide-react';
import { Sheet } from './ui';
import { COMMUNITY_FORMATS, renderCommunityCard, type CommunityCardFormat } from './cardImage';
import { canShareFiles, shareOrDownload } from './SaveCardSheet';
import { communityLink, type Community } from '../lib/useCommunities';

const ORDER: CommunityCardFormat[] = ['post', 'story'];

function CardBody({ c, onClose }: { c: Community; onClose: () => void }) {
  const [format, setFormat] = useState<CommunityCardFormat>('post');
  const [files, setFiles] = useState<Partial<Record<CommunityCardFormat, { file: File; url: string }>>>({});
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const current = files[format];
  const filesRef = useRef(files);
  useEffect(() => {
    filesRef.current = files;
  }, [files]);

  useEffect(() => {
    if (files[format]) return;
    let live = true;
    renderCommunityCard({ name: c.community_name, logoUrl: c.community_logo_url, slug: c.slug }, format)
      .then((file) => live && setFiles((f) => ({ ...f, [format]: { file, url: URL.createObjectURL(file) } })))
      .catch(() => live && setNote('Couldn’t make the image. Try again.'));
    return () => {
      live = false;
    };
  }, [format, files, c]);

  useEffect(() => () => Object.values(filesRef.current).forEach((f) => f && URL.revokeObjectURL(f.url)), []);

  // The link goes with the image, so the post works for people who don't scan.
  const caption = `${c.community_name} is on Mumbai Onchain for IBW, Devcon 8 and ETHGlobal Mumbai. Join us in the app: ${communityLink(c.slug)}`;

  async function save() {
    if (!current) return;
    setBusy(true);
    setNote('');
    const result = await shareOrDownload(current.file, caption);
    setBusy(false);
    if (result === 'downloaded') setNote('Saved to your downloads. Post it with your invite link.');
  }

  const { w, h, hint } = COMMUNITY_FORMATS[format];

  return (
    <Sheet open onClose={onClose} label="Share card">
      <div className="px-5 pt-2">
        <h2 className="app-title text-[22px]">Share card</h2>
        <div className="clear-both mt-4 flex flex-col gap-4">
          <div role="radiogroup" aria-label="Image type" className="grid grid-cols-2 p-1 rounded-full bg-[var(--app-segment)]">
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
                className={`h-9 rounded-full text-[14px] font-bold ${format === id ? 'bg-[var(--app-primary)] text-[var(--app-on-primary)]' : 'text-[var(--app-muted)]'}`}
              >
                {COMMUNITY_FORMATS[id].label}
              </button>
            ))}
          </div>

          <div className="flex justify-center">
            <div
              className="relative rounded-2xl overflow-hidden border border-[var(--app-line)] bg-[#0A0A0C] flex items-center justify-center"
              style={{ aspectRatio: `${w} / ${h}`, height: format === 'post' ? 'auto' : 'min(46dvh, 420px)', width: format === 'post' ? '100%' : 'auto' }}
            >
              {current ? (
                <img src={current.url} alt={`${COMMUNITY_FORMATS[format].label} image for ${c.community_name}`} className="w-full h-full object-contain" />
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

/** A community's invite as an image, to post with its link on X, Telegram or stories. */
export function CommunityCardSheet({ community, onClose }: { community: Community | null; onClose: () => void }) {
  return community ? <CardBody c={community} onClose={onClose} /> : null;
}
