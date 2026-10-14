import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Check, Contact, Copy, Share2 } from 'lucide-react';
import type { PersonProfile } from '../types/person';
import { PersonAvatar } from '../components/PersonAvatar';
import { Sheet } from './ui';
import { profileUrl, vCard } from './qr';

interface PassSheetProps {
  person: PersonProfile | null;
  isOpen: boolean;
  onClose: () => void;
}

function PassBody({ person, onClose }: { person: PersonProfile; onClose: () => void }) {
  const url = profileUrl(person.id);
  const [qr, setQr] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // High error correction so a scratched or dim phone screen still scans.
    QRCode.toDataURL(url, { width: 560, margin: 1, errorCorrectionLevel: 'H', color: { dark: '#121216', light: '#FFFFFF' } })
      .then(setQr)
      .catch(() => setQr(''));
  }, [url]);

  async function share() {
    try {
      if (navigator.share) await navigator.share({ title: person.name, text: 'Add me on Mumbai Onchain', url });
      else await copy();
    } catch {
      // share sheet dismissed
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard blocked; the share sheet is the other route
    }
  }

  function saveContact() {
    const blob = new Blob([vCard(person)], { type: 'text/vcard;charset=utf-8' });
    const href = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = href;
    a.download = `${person.name.replace(/\s+/g, '_')}.vcf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(href), 1000);
  }

  const action =
    'app-press flex flex-col items-center gap-1.5 py-3 rounded-2xl bg-[var(--app-surface)] border border-[var(--app-line)] text-[13px] font-medium';

  return (
    <Sheet open onClose={onClose} label="My pass">
      <div className="px-5 pt-4">
        {/* The pass: white card, built to be held up and scanned */}
        <div className="rounded-[28px] bg-white text-[#1A1033] border border-black/5 shadow-[0_8px_30px_rgba(0,0,0,0.08)] overflow-hidden">
          <div className="px-5 pt-5 pb-4 flex items-center gap-3">
            <PersonAvatar name={person.name} avatarUrl={person.avatar} size="md" className="rounded-full! border-0! w-14! h-14!" />
            <div className="min-w-0">
              <div className="app-title text-[20px] font-bold leading-tight truncate">{person.name}</div>
              <div className="text-[14px] text-[#625A7D] truncate">
                {person.headline || [person.category, person.city].filter(Boolean).join(' · ')}
              </div>
            </div>
          </div>
          <div className="px-8 pb-2">
            {qr ? (
              <img src={qr} alt={`QR code for ${person.name}'s profile`} className="w-full aspect-square" />
            ) : (
              <div className="w-full aspect-square rounded-xl bg-[var(--app-bg)]" />
            )}
          </div>
          <div className="px-5 py-4 border-t border-dashed border-black/10 flex items-center justify-between">
            <span className="text-[14px] font-semibold">Scan to add me</span>
            <img src="/icons/favicon-64.png" alt="Mumbai Onchain" className="w-7 h-7" />
          </div>
        </div>

        <p className="mt-3 text-center text-[14px] text-[var(--app-muted)]">
          Turn your screen brightness up if their camera struggles.
        </p>

        <div className="mt-5 grid grid-cols-3 gap-2">
          <button type="button" onClick={share} className={action}>
            <Share2 className="w-5 h-5" aria-hidden="true" /> Share
          </button>
          <button type="button" onClick={copy} className={action}>
            {copied ? <Check className="w-5 h-5" aria-hidden="true" /> : <Copy className="w-5 h-5" aria-hidden="true" />}
            {copied ? 'Copied' : 'Copy link'}
          </button>
          <button type="button" onClick={saveContact} className={action}>
            <Contact className="w-5 h-5" aria-hidden="true" /> Contact card
          </button>
        </div>
      </div>
    </Sheet>
  );
}

export const PassSheet: React.FC<PassSheetProps> = ({ person, isOpen, onClose }) =>
  isOpen && person ? <PassBody person={person} onClose={onClose} /> : null;
