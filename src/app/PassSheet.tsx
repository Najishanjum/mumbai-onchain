import React, { useState } from 'react';
import { Check, Contact, Copy, ImageDown, Share2 } from 'lucide-react';
import type { PersonProfile } from '../types/person';
import { Sheet } from './ui';
import { LanyardBadge } from './Badge';
import { profileUrl, vCard } from './qr';

interface PassSheetProps {
  person: PersonProfile | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveCard: () => void;
}

function PassBody({ person, onClose, onSaveCard }: { person: PersonProfile; onClose: () => void; onSaveCard: () => void }) {
  const url = profileUrl(person.id);
  const [copied, setCopied] = useState(false);
  // Opened to be scanned, so it starts on the QR side.
  const [flipped, setFlipped] = useState(true);

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
    'app-press flex flex-col items-center gap-1.5 py-3 rounded-2xl bg-[var(--app-surface)] border border-[var(--app-line)] text-[13px] font-semibold';

  return (
    <Sheet open onClose={onClose} label="My pass">
      <div className="px-5 pt-2">
        <LanyardBadge person={person} size="lg" flipped={flipped} onFlip={setFlipped} />

        <p className="mt-4 min-h-[42px] px-4 text-center text-[14px] leading-[21px] text-[var(--app-muted)]">
          {flipped ? 'Turn your screen brightness up if their camera struggles.' : 'Tap the badge to show your QR.'}
        </p>

        <div className="mt-5 grid grid-cols-2 gap-2">
          <button type="button" onClick={onSaveCard} className={action}>
            <ImageDown className="w-5 h-5" aria-hidden="true" /> Save card
          </button>
          <button type="button" onClick={share} className={action}>
            <Share2 className="w-5 h-5" aria-hidden="true" /> Share link
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

export const PassSheet: React.FC<PassSheetProps> = ({ person, isOpen, onClose, onSaveCard }) =>
  isOpen && person ? <PassBody person={person} onClose={onClose} onSaveCard={onSaveCard} /> : null;
