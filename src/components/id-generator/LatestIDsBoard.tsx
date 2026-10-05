import React, { useState } from 'react';
import { GeneratedIdRecord } from './useIdManager';
import { Users, ExternalLink, Sparkles } from 'lucide-react';

interface LatestIDsBoardProps {
  records: GeneratedIdRecord[];
  totalCount: number;
}

export const LatestIDsBoard: React.FC<LatestIDsBoardProps> = ({ records, totalCount }) => {
  const [displayLimit, setDisplayLimit] = useState(6);

  const formatTimeAgo = (timestamp: number) => {
    const diff = Math.max(1, Math.floor((Date.now() - timestamp) / 1000));
    if (diff < 60) return `${diff}s ago`;
    const mins = Math.floor(diff / 60);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    return `${hrs}h ago`;
  };

  const visible = records.slice(0, displayLimit);

  return (
    <section className="w-full mt-16 max-w-5xl mx-auto px-4 select-none">
      <div className="bg-[#12102E]/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Header with live count badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#5FE3D6]/10 border border-[#5FE3D6]/30 flex items-center justify-center text-[#5FE3D6]">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-black text-xl text-white uppercase tracking-tight">
                Latest MumbaiOnChain IDs
              </h3>
              <p className="font-mono text-xs text-gray-400">
                Community members who generated their onchain identity pass
              </p>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1C184E] border border-[#5FE3D6]/30 text-xs font-mono text-[#5FE3D6] self-start sm:self-center">
            <Sparkles className="w-3.5 h-3.5 text-[#F6A067]" />
            <strong className="text-white">{totalCount.toLocaleString()}</strong> IDs Generated
          </div>
        </div>

        {/* Grid of Latest Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {visible.map((rec) => {
            const idStr = String(rec.id).padStart(4, '0');
            return (
              <div
                key={`${rec.handle}-${rec.id}`}
                className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full overflow-hidden border border-white/20 shrink-0 bg-black">
                    <img
                      src={rec.avatarUrl}
                      alt={rec.handle}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>

                  <div className="min-w-0">
                    <div className="font-bold text-xs text-white truncate group-hover:text-[#5FE3D6] transition-colors">
                      {rec.displayName || `@${rec.handle}`}
                    </div>
                    <a
                      href={`https://x.com/${rec.handle}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-[11px] text-gray-400 hover:text-white flex items-center gap-1"
                    >
                      <span>@{rec.handle}</span>
                      <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                    </a>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="px-2 py-0.5 rounded bg-[#F6A067]/20 border border-[#F6A067]/40 text-[#F6A067] font-mono text-[10px] font-bold">
                    MOC {idStr}
                  </div>
                  <span className="font-mono text-[10px] text-gray-500 block mt-1">
                    {formatTimeAgo(rec.timestamp)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Show More toggle */}
        {records.length > displayLimit && (
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => setDisplayLimit((prev) => prev + 6)}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 font-mono text-xs text-gray-300 hover:text-white transition-all"
            >
              Show More Community Passes →
            </button>
          </div>
        )}
      </div>
    </section>
  );
};
