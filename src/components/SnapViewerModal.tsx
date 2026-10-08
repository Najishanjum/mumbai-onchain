import React, { useState, useEffect, useCallback } from 'react';
import type { Snap } from '../types/snap';
import type { PersonProfile } from '../types/person';
import { useSnapStore } from '../lib/useSnapStore';
import { usePeopleStore } from '../lib/usePeopleStore';
import { calculateMatchScore } from '../lib/matchingEngine';
import {
  X,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Calendar,
  Heart,
  Flame,
  Eye,
  HandMetal,
  ArrowRight,
  Tag,
  MoreHorizontal,
  Trash2,
} from 'lucide-react';

interface SnapViewerModalProps {
  snap: Snap | null;
  onClose: () => void;
  onOpenProfile: (personId: string) => void;
}

export const SnapViewerModal: React.FC<SnapViewerModalProps> = ({
  snap,
  onClose,
  onOpenProfile,
}) => {
  const { snaps, userReactions, toggleReaction, setActiveSnapForViewer, deleteSnap, isOwnerOfSnap } = useSnapStore();
  const { people, myProfile, connections } = usePeopleStore();

  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Current snap index and navigation
  const currentIndex = snap ? snaps.findIndex(s => s.id === snap.id) : -1;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < snaps.length - 1;

  const handlePrev = useCallback(() => {
    if (hasPrev && currentIndex > 0) {
      setActiveSnapForViewer(snaps[currentIndex - 1]);
    }
  }, [hasPrev, currentIndex, snaps, setActiveSnapForViewer]);

  const handleNext = useCallback(() => {
    if (hasNext && currentIndex >= 0) {
      setActiveSnapForViewer(snaps[currentIndex + 1]);
    }
  }, [hasNext, currentIndex, snaps, setActiveSnapForViewer]);

  // Keyboard navigation
  useEffect(() => {
    if (!snap) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft') handlePrev();
      else if (e.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [snap, onClose, handlePrev, handleNext]);

  if (!snap) return null;

  // Find author profile and calculate match
  const authorProfile = people.find(p => p.id === snap.authorId) || null;
  const match = authorProfile ? calculateMatchScore(myProfile, authorProfile, connections) : null;

  // Resolve tagged people
  const taggedPeople: PersonProfile[] = (snap.taggedPersonIds || [])
    .map(id => people.find(p => p.id === id))
    .filter((p): p is PersonProfile => Boolean(p));

  const activeReactions = userReactions[snap.id] || [];

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 select-none animate-in fade-in duration-200"
      role="dialog"
      aria-label="Snap Lightbox Viewer"
    >
      {/* Background click to dismiss */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-4xl bg-[#0A0A0A] border-2 border-[#262626] rounded-xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[92vh]">
        
        {/* Left: Image viewport + overlay nav */}
        <div className="relative flex-1 bg-[#000000] flex items-center justify-center min-h-[340px] md:min-h-[500px] overflow-hidden group">
          <img
            src={snap.imageUrl}
            alt={snap.caption || `Snap captured by ${snap.authorName}`}
            className="w-full h-full object-contain max-h-[70vh] md:max-h-[85vh]"
          />

          {/* Close button on mobile overlay */}
          <button
            type="button"
            onClick={onClose}
            className="md:hidden absolute top-3 right-3 p-2 rounded-full bg-black/70 text-white hover:bg-black transition-colors"
            aria-label="Close viewer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Previous / Next buttons */}
          {hasPrev && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/70 hover:bg-black text-white border border-[#333333] transition-all hover:scale-105 active:scale-95 cursor-pointer"
              title="Previous Snap (←)"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          {hasNext && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/70 hover:bg-black text-white border border-[#333333] transition-all hover:scale-105 active:scale-95 cursor-pointer"
              title="Next Snap (→)"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Right: Metadata, Creator, Match & Social Loop */}
        <div className="w-full md:w-88 lg:w-96 bg-[#111111] border-t md:border-t-0 md:border-l border-[#262626] p-5 flex flex-col justify-between overflow-y-auto space-y-4">
          
          {/* Top Bar: Event Badge, Owner Menu & Close button (desktop) */}
          <div className="flex items-center justify-between border-b border-[#222222] pb-3">
            <div className="space-y-0.5 min-w-0 pr-2">
              <span className="font-mono text-[10px] text-[#888888] uppercase tracking-widest">
                MUMBAI ONCHAIN // SNAP MEMORY
              </span>
              <div className="font-heading font-black text-sm text-[#FFFFFF] truncate">
                {snap.eventName || 'Mumbai Onchain Week'}
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {isOwnerOfSnap(snap) && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="p-1.5 border border-[#333333] hover:border-[#666666] text-[#AAAAAA] hover:text-[#FFFFFF] rounded transition-colors cursor-pointer"
                    title="Snap Options"
                    aria-label="Snap options"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>

                  {isMenuOpen && (
                    <div className="absolute right-0 top-full mt-1 w-36 bg-[#1A1A1A] border border-[#333333] shadow-xl rounded z-30 py-1 font-mono text-xs animate-in fade-in duration-100">
                      <button
                        type="button"
                        disabled={isDeleting}
                        onClick={async () => {
                          if (window.confirm('Delete this Snap? This cannot be undone.')) {
                            try {
                              setIsDeleting(true);
                              await deleteSnap(snap.id);
                              onClose();
                            } catch (e) {
                              console.error('Delete failed:', e);
                            } finally {
                              setIsDeleting(false);
                            }
                          }
                        }}
                        className="w-full text-left px-3 py-2 text-red-400 hover:bg-red-950/40 hover:text-red-300 flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{isDeleting ? 'Deleting...' : 'Delete Snap'}</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={onClose}
                className="hidden md:flex p-1.5 border border-[#333333] hover:border-[#666666] text-[#888888] hover:text-[#FFFFFF] rounded transition-colors"
                aria-label="Close viewer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Author info & Match connection */}
          <div className="space-y-3">
            <div className="p-3 bg-[#171717] border border-[#2A2A2A] rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <div
                  onClick={() => {
                    onClose();
                    onOpenProfile(snap.authorId);
                  }}
                  className="flex items-center gap-2.5 cursor-pointer group/author min-w-0"
                  title={`View ${snap.authorName}'s Profile`}
                >
                  {snap.authorAvatar ? (
                    <img
                      src={snap.authorAvatar}
                      alt={snap.authorName}
                      className="w-9 h-9 rounded-full object-cover border border-[#444444] group-hover/author:border-white transition-colors shrink-0"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-[#2A2A2A] border border-[#444444] group-hover/author:border-white transition-colors flex items-center justify-center font-bold text-xs text-white shrink-0">
                      {snap.authorName.charAt(0)}
                    </div>
                  )}

                  <div className="min-w-0">
                    <div className="font-heading font-bold text-xs sm:text-sm text-[#FFFFFF] group-hover/author:underline truncate">
                      {snap.authorName}
                    </div>
                    <div className="font-mono text-[10px] text-[#888888] truncate">
                      {snap.authorRole || 'Builder'} • {snap.authorCity || 'Mumbai'}
                    </div>
                  </div>
                </div>

                {/* Match percentage pill */}
                {match && authorProfile && authorProfile.id !== myProfile?.id && (
                  <div className="shrink-0 font-mono text-[11px] font-black px-2 py-0.5 rounded bg-[#F97316]/10 text-[#F97316] border border-[#F97316]/30 ml-2">
                    {match.overall}% MATCH
                  </div>
                )}
              </div>

              {/* One-click: Discover Person -> Match -> Connect */}
              {authorProfile && authorProfile.id !== myProfile?.id && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenProfile(snap.authorId);
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-[#FFFFFF] hover:bg-[#E5E5E5] text-[#000000] py-2 px-3 rounded font-heading font-black text-xs uppercase tracking-wide transition-all shadow-sm active:scale-98 cursor-pointer"
                >
                  <span>VIEW BUILDER PROFILE</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Caption */}
            {snap.caption && (
              <p className="font-sans text-xs sm:text-sm text-[#D4D4D4] leading-relaxed italic">
                "{snap.caption}"
              </p>
            )}

            {/* Tiny Event & Date metadata */}
            <div className="font-mono text-[11px] text-[#777777] space-y-1 pt-1 border-t border-[#1F1F1F]">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3 h-3 text-[#F97316]" />
                <span>{snap.date}</span>
              </div>
              {snap.location && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3 h-3 text-[#22C55E]" />
                  <span>{snap.location}</span>
                </div>
              )}
            </div>

            {/* People Tagged in Snap */}
            {taggedPeople.length > 0 && (
              <div className="space-y-1.5 pt-2 border-t border-[#1F1F1F]">
                <div className="font-mono text-[10px] text-[#888888] uppercase tracking-wider flex items-center gap-1">
                  <Tag className="w-3 h-3 text-[#A855F7]" />
                  <span>People in this Snap:</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {taggedPeople.map(tagged => (
                    <button
                      key={tagged.id}
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenProfile(tagged.id);
                      }}
                      className="inline-flex items-center gap-1 bg-[#1A1A1A] hover:bg-[#262626] border border-[#333333] hover:border-[#666666] px-2 py-0.5 rounded text-[10px] font-mono text-[#E5E5E5] transition-colors cursor-pointer"
                    >
                      <span>@{tagged.name.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Bottom Bar: Lightweight Reactions */}
          <div className="pt-3 border-t border-[#222222] space-y-2">
            <div className="font-mono text-[10px] text-[#777777] uppercase tracking-wider">
              REACT TO MOMENT
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              {/* Heart */}
              <button
                type="button"
                onClick={() => toggleReaction(snap.id, 'heart')}
                className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded font-mono text-xs font-bold transition-all border ${
                  activeReactions.includes('heart')
                    ? 'bg-red-950/60 text-red-400 border-red-700/60'
                    : 'bg-[#181818] text-[#888888] border-[#2A2A2A] hover:border-[#444444]'
                }`}
                title="Love"
              >
                <Heart className={`w-3.5 h-3.5 ${activeReactions.includes('heart') ? 'fill-red-400 text-red-400' : ''}`} />
                <span>{snap.reactions.heart}</span>
              </button>

              {/* Fire */}
              <button
                type="button"
                onClick={() => toggleReaction(snap.id, 'fire')}
                className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded font-mono text-xs font-bold transition-all border ${
                  activeReactions.includes('fire')
                    ? 'bg-orange-950/60 text-orange-400 border-orange-700/60'
                    : 'bg-[#181818] text-[#888888] border-[#2A2A2A] hover:border-[#444444]'
                }`}
                title="Fire"
              >
                <Flame className={`w-3.5 h-3.5 ${activeReactions.includes('fire') ? 'fill-orange-400 text-orange-400' : ''}`} />
                <span>{snap.reactions.fire}</span>
              </button>

              {/* Eyes */}
              <button
                type="button"
                onClick={() => toggleReaction(snap.id, 'eyes')}
                className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded font-mono text-xs font-bold transition-all border ${
                  activeReactions.includes('eyes')
                    ? 'bg-blue-950/60 text-blue-400 border-blue-700/60'
                    : 'bg-[#181818] text-[#888888] border-[#2A2A2A] hover:border-[#444444]'
                }`}
                title="Eyes"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{snap.reactions.eyes}</span>
              </button>

              {/* Clap */}
              <button
                type="button"
                onClick={() => toggleReaction(snap.id, 'clap')}
                className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded font-mono text-xs font-bold transition-all border ${
                  activeReactions.includes('clap')
                    ? 'bg-emerald-950/60 text-emerald-400 border-emerald-700/60'
                    : 'bg-[#181818] text-[#888888] border-[#2A2A2A] hover:border-[#444444]'
                }`}
                title="Clap"
              >
                <HandMetal className="w-3.5 h-3.5" />
                <span>{snap.reactions.clap}</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
