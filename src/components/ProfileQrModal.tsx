import React, { useEffect, useState, useRef } from 'react';
import QRCode from 'qrcode';
import type { PersonProfile, ConnectionStatus } from '../types/person';
import { PersonAvatar } from './PersonAvatar';
import {
  X,
  Download,
  Copy,
  Check,
  ExternalLink,
  MapPin,
  UserCheck,
  Clock,
  Plus,
  Contact
} from 'lucide-react';

interface ProfileQrModalProps {
  person: PersonProfile | null;
  isOpen: boolean;
  onClose: () => void;
  connectionStatus: ConnectionStatus;
  onCycleConnection: (personId: string) => void;
  isCurrentUser: boolean;
}

export const ProfileQrModal: React.FC<ProfileQrModalProps> = ({
  person,
  isOpen,
  onClose,
  connectionStatus,
  onCycleConnection,
  isCurrentUser,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!person || !isOpen) return;

    // Generate link that directly opens this profile when scanned
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://mumbaionchain.xyz';
    const profileUrl = `${origin}/?tab=people&person=${encodeURIComponent(person.id)}`;

    // Generate high quality styled QR code
    QRCode.toDataURL(profileUrl, {
      width: 512,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'H'
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('QR generation error:', err));
  }, [person, isOpen]);

  if (!isOpen || !person) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://mumbaionchain.xyz';
  const profileUrl = `${origin}/?tab=people&person=${encodeURIComponent(person.id)}`;

  // Clean handles
  const cleanXHandle = person.xHandle
    ? person.xHandle.replace(/^@/, '').replace(/https?:\/\/(www\.)?(twitter|x)\.com\//, '')
    : null;
  const cleanGithub = person.githubUrl
    ? person.githubUrl.replace(/https?:\/\/(www\.)?github\.com\//, '').replace(/\/$/, '')
    : null;
  const cleanTg = person.telegramHandle
    ? person.telegramHandle.replace(/^@/, '').replace(/https?:\/\/t\.me\//, '')
    : null;
  const cleanFc = person.farcasterHandle
    ? person.farcasterHandle.replace(/^@/, '').replace(/https?:\/\/(warpcast\.com|farcaster\.xyz)\//, '')
    : null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(profileUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Download QR Badge PNG
  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `mumbai-connect-qr-${person.name.toLowerCase().replace(/\s+/g, '-')}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Download vCard (.vcf)
  const handleDownloadVCard = () => {
    const vCardLines = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${person.name}`,
      `NOTE:${person.bio || 'Mumbai Onchain Community'}`,
      person.city ? `ADR;TYPE=WORK:;;${person.city};;;;` : '',
      cleanXHandle ? `X-SOCIALPROFILE;type=twitter:https://x.com/${cleanXHandle}` : '',
      cleanGithub ? `X-SOCIALPROFILE;type=github:https://github.com/${cleanGithub}` : '',
      cleanTg ? `X-SOCIALPROFILE;type=telegram:https://t.me/${cleanTg}` : '',
      person.linkedinUrl ? `URL;type=linkedin:${person.linkedinUrl}` : '',
      person.websiteUrl ? `URL:${person.websiteUrl}` : '',
      `URL;type=mumbaionchain:${profileUrl}`,
      'END:VCARD'
    ].filter(Boolean).join('\r\n');

    const blob = new Blob([vCardLines], { type: 'text/vcard;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${person.name.replace(/\s+/g, '_')}_contact.vcf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 select-none animate-in fade-in duration-200">
      {/* Backdrop */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Modal Card */}
      <div
        ref={cardRef}
        className="relative w-full max-w-md bg-[#FFFFFF] border-2 border-[#000000] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] z-10 overflow-hidden my-8"
      >
        {/* Top Header Bar */}
        <div className="bg-[#000000] text-[#FFFFFF] p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-[#22C55E] rounded-full animate-pulse" />
            <span className="font-mono text-xs font-black uppercase tracking-widest">
              ONCHAIN CONNECT PASS // SCANNER
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[#FFFFFF] hover:text-[#000000] text-[#FFFFFF] transition-colors border border-transparent hover:border-[#000000]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Card Body */}
        <div className="p-6 space-y-5">
          {/* Identity Header */}
          <div className="flex items-center gap-3.5 border-b border-[#EAEAEA] pb-4">
            <PersonAvatar
              name={person.name}
              avatarUrl={person.avatar}
              size="lg"
              className="border-2 border-[#000000] shadow-sm"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-black text-xl text-[#000000] truncate">
                  {person.name}
                </h3>
                {isCurrentUser && (
                  <span className="font-mono text-[9px] font-bold bg-[#000000] text-[#FFFFFF] px-1.5 py-0.5 uppercase">
                    YOU
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 font-mono text-xs text-[#555555] mt-0.5">
                <MapPin className="w-3 h-3 text-[#000000] shrink-0" />
                <span className="truncate">{person.city}</span>
                <span>•</span>
                <span className="font-bold text-[#000000] uppercase text-[10px] px-1.5 py-0.2 bg-[#F0FDF4] border border-[#BBF7D0] text-[#15803D]">
                  {person.category}
                </span>
              </div>
            </div>
          </div>

          {/* High Contrast QR Code Display Box */}
          <div className="bg-[#FAFAFA] border-2 border-[#000000] p-4 flex flex-col items-center justify-center relative group">
            <div className="absolute top-2 left-2 font-mono text-[9px] text-[#777777] uppercase tracking-wider">
              [ ☲ SCAN WITH CAMERA ]
            </div>
            <div className="absolute top-2 right-2 font-mono text-[9px] text-[#15803D] uppercase font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-[#22C55E] rounded-full" />
              VERIFIED
            </div>

            <div className="mt-4 mb-2 bg-[#FFFFFF] p-3 border border-[#000000] shadow-inner">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`QR Pass for ${person.name}`}
                  className="w-48 h-48 sm:w-56 sm:h-56 object-contain"
                />
              ) : (
                <div className="w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center font-mono text-xs text-gray-400">
                  Generating QR Code...
                </div>
              )}
            </div>

            <div className="text-center font-mono text-[11px] text-[#444444] mt-1">
              Scan to directly view full profile & connect onchain
            </div>
          </div>

          {/* Direct Social Accounts & Links Hub */}
          <div className="space-y-2">
            <div className="font-mono text-[10px] font-bold text-[#777777] uppercase tracking-wider">
              DIRECT SOCIAL ACCOUNTS & LINKS:
            </div>
            <div className="grid grid-cols-2 gap-2 font-mono text-xs">
              {cleanXHandle && (
                <a
                  href={`https://x.com/${cleanXHandle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-2.5 bg-[#000000] text-[#FFFFFF] hover:bg-[#222222] transition-colors group"
                >
                  <span className="flex items-center gap-1.5 truncate">
                    <span className="font-black text-xs">𝕏</span>
                    <span className="truncate">@{cleanXHandle}</span>
                  </span>
                  <ExternalLink className="w-3 h-3 shrink-0 opacity-70 group-hover:opacity-100" />
                </a>
              )}

              {cleanGithub && (
                <a
                  href={person.githubUrl?.startsWith('http') ? person.githubUrl : `https://github.com/${cleanGithub}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-2.5 border border-[#000000] bg-[#FFFFFF] hover:bg-[#000000] hover:text-[#FFFFFF] transition-colors group"
                >
                  <span className="flex items-center gap-1.5 truncate">
                    <span className="font-bold text-xs">GH:</span>
                    <span className="truncate">{cleanGithub}</span>
                  </span>
                  <ExternalLink className="w-3 h-3 shrink-0 opacity-70 group-hover:opacity-100" />
                </a>
              )}

              {cleanTg && (
                <a
                  href={`https://t.me/${cleanTg}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-2.5 bg-[#229ED9] text-[#FFFFFF] hover:opacity-90 transition-colors group"
                >
                  <span className="flex items-center gap-1.5 truncate">
                    <span className="font-bold text-xs">TG:</span>
                    <span className="truncate">@{cleanTg}</span>
                  </span>
                  <ExternalLink className="w-3 h-3 shrink-0 opacity-70 group-hover:opacity-100" />
                </a>
              )}

              {cleanFc && (
                <a
                  href={`https://warpcast.com/${cleanFc}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-2.5 bg-[#8A63D2] text-[#FFFFFF] hover:opacity-90 transition-colors group"
                >
                  <span className="flex items-center gap-1.5 truncate">
                    <span className="font-bold text-xs">FC:</span>
                    <span className="truncate">@{cleanFc}</span>
                  </span>
                  <ExternalLink className="w-3 h-3 shrink-0 opacity-70 group-hover:opacity-100" />
                </a>
              )}

              {person.linkedinUrl && (
                <a
                  href={person.linkedinUrl.startsWith('http') ? person.linkedinUrl : `https://${person.linkedinUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${!cleanTg && !cleanFc ? 'col-span-2' : ''} flex items-center justify-between p-2.5 border border-[#000000] bg-[#0077B5] text-[#FFFFFF] hover:opacity-95 transition-colors group`}
                >
                  <span className="flex items-center gap-1.5 truncate">
                    <span className="font-bold text-xs">in:</span>
                    <span className="truncate">LinkedIn</span>
                  </span>
                  <ExternalLink className="w-3 h-3 shrink-0 opacity-70 group-hover:opacity-100" />
                </a>
              )}

              {person.websiteUrl && (
                <a
                  href={person.websiteUrl.startsWith('http') ? person.websiteUrl : `https://${person.websiteUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="col-span-2 flex items-center justify-between p-2.5 border border-[#000000] bg-[#FFFFFF] hover:bg-[#F5F5F5] transition-colors group"
                >
                  <span className="flex items-center gap-1.5 truncate">
                    <span className="font-bold text-xs">🌐 Web:</span>
                    <span className="truncate">{person.websiteUrl}</span>
                  </span>
                  <ExternalLink className="w-3 h-3 shrink-0 opacity-70 group-hover:opacity-100" />
                </a>
              )}
            </div>
          </div>

          {/* Quick Actions Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-[#EAEAEA]">
            {/* Direct Connect Toggle */}
            {!isCurrentUser && (
              <button
                type="button"
                onClick={() => onCycleConnection(person.id)}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 font-mono text-xs font-bold transition-all border ${
                  connectionStatus === 'CONNECTED'
                    ? 'bg-[#15803D] border-[#15803D] text-[#FFFFFF]'
                    : connectionStatus === 'REQUESTED'
                    ? 'bg-[#D97706] border-[#D97706] text-[#FFFFFF]'
                    : 'bg-[#000000] border-[#000000] text-[#FFFFFF]'
                }`}
              >
                {connectionStatus === 'CONNECTED' ? (
                  <>
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>CONNECTED</span>
                  </>
                ) : connectionStatus === 'REQUESTED' ? (
                  <>
                    <Clock className="w-3.5 h-3.5" />
                    <span>REQUESTED</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    <span>CONNECT</span>
                  </>
                )}
              </button>
            )}

            {/* Copy Link */}
            <button
              type="button"
              onClick={handleCopyLink}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 border border-[#000000] font-mono text-xs font-bold transition-colors ${
                copiedLink ? 'bg-[#22C55E] text-[#FFFFFF] border-[#22C55E]' : 'bg-[#FFFFFF] text-[#000000] hover:bg-[#F5F5F5]'
              }`}
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>COPIED!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>COPY LINK</span>
                </>
              )}
            </button>

            {/* Download QR Image */}
            <button
              type="button"
              onClick={handleDownloadQr}
              className="flex items-center justify-center gap-1.5 py-2 px-3 border border-[#000000] bg-[#FFFFFF] hover:bg-[#000000] hover:text-[#FFFFFF] font-mono text-xs font-bold transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>SAVE QR</span>
            </button>

            {/* Save vCard Contact */}
            <button
              type="button"
              onClick={handleDownloadVCard}
              className={`${isCurrentUser ? 'col-span-1' : 'col-span-2 sm:col-span-3'} flex items-center justify-center gap-1.5 py-2 px-3 border border-[#000000] bg-[#FAFAFA] hover:bg-[#000000] hover:text-[#FFFFFF] font-mono text-xs font-bold transition-colors`}
            >
              <Contact className="w-3.5 h-3.5" />
              <span>ADD TO PHONE CONTACTS (.VCF)</span>
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-[#FAFAFA] border-t border-[#000000] p-3 px-6 flex items-center justify-between font-mono text-[10px] text-[#777777]">
          <span>MUMBAI ONCHAIN // 2026</span>
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
