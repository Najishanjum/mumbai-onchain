import React from 'react';
import type { MatchScoreBreakdown } from '../types/matching';
import { Target, Wrench, Ticket, MapPin, Users, Sparkles, CheckCircle2 } from 'lucide-react';

interface MatchBreakdownCardProps {
  match: MatchScoreBreakdown;
  targetName: string;
  targetRole?: string;
  compact?: boolean;
}

export const MatchBreakdownCard: React.FC<MatchBreakdownCardProps> = ({
  match,
  targetName,
  targetRole,
  compact = false,
}) => {
  // Category badge styles
  const getBadgeStyle = () => {
    switch (match.category) {
      case 'EXCELLENT':
        return 'bg-[#FFF7ED] text-[#C2410C] border-[#FDBA74]';
      case 'STRONG':
        return 'bg-[#F0FDF4] text-[#15803D] border-[#86EFAC]';
      case 'GOOD':
        return 'bg-[#EFF6FF] text-[#1D4ED8] border-[#93C5FD]';
      default:
        return 'bg-[#FAFAFA] text-[#525252] border-[#E5E5E5]';
    }
  };

  const getScoreColor = () => {
    if (match.overall >= 90) return 'text-[#F97316]';
    if (match.overall >= 80) return 'text-[#16A34A]';
    if (match.overall >= 70) return 'text-[#2563EB]';
    return 'text-[#525252]';
  };

  const getBarColor = (score: number) => {
    if (score >= 90) return 'bg-[#F97316]';
    if (score >= 80) return 'bg-[#16A34A]';
    if (score >= 70) return 'bg-[#2563EB]';
    return 'bg-[#737373]';
  };

  if (compact) {
    return (
      <div className="bg-[#FFFFFF] border border-[#000000] p-3 space-y-2 select-none shadow-xs">
        <div className="flex items-center justify-between">
          <div className="font-mono text-[10px] text-[#666666] uppercase tracking-wider">
            NETWORKING MATCH
          </div>
          <span className={`font-mono text-[10px] font-bold px-1.5 py-0.5 border ${getBadgeStyle()}`}>
            {match.categoryBadge}
          </span>
        </div>

        <div className="flex items-baseline justify-between">
          <div className="font-heading font-black text-xl text-[#000000] flex items-center gap-1.5">
            <span className={getScoreColor()}>{match.overall}%</span>
            <span className="text-xs text-[#888888] font-mono font-normal">COMPATIBILITY</span>
          </div>
          <div className="font-mono text-[11px] text-[#444444] truncate max-w-[140px]">
            You × {targetName.split(' ')[0]}
          </div>
        </div>

        {/* 1-line reason */}
        {match.reasons.length > 0 && (
          <div className="text-[11px] font-sans text-[#333333] flex items-center gap-1.5 truncate border-t border-[#F0F0F0] pt-1.5">
            <Sparkles className="w-3 h-3 text-[#F97316] shrink-0" />
            <span className="truncate">{match.reasons[0]}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-[#FFFFFF] border-2 border-[#000000] p-5 sm:p-6 space-y-5 select-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      {/* Header comparison pill */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#000000] pb-4">
        <div>
          <div className="font-mono text-[11px] text-[#666666] uppercase tracking-widest flex items-center gap-1.5">
            <span>BUILDER COMPATIBILITY</span>
            <span>•</span>
            <span>NETWORKING ALIGNMENT</span>
          </div>
          <div className="font-heading font-black text-lg sm:text-xl text-[#000000] tracking-tight mt-0.5">
            YOU × {targetName.toUpperCase()}
          </div>
          {targetRole && (
            <div className="font-mono text-xs text-[#777777]">
              {targetRole}
            </div>
          )}
        </div>

        {/* Big Match Score */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className={`font-heading font-black text-3xl sm:text-4xl leading-none ${getScoreColor()}`}>
              {match.overall}%
            </div>
            <div className="font-mono text-[10px] text-[#666666] tracking-wider uppercase font-bold">
              MATCH SCORE
            </div>
          </div>
          <div className={`px-2.5 py-1 font-mono text-xs font-bold border-2 ${getBadgeStyle()}`}>
            {match.categoryBadge}
          </div>
        </div>
      </div>

      {/* 5-Dimensional Breakdown */}
      <div className="space-y-3">
        <div className="font-mono text-xs font-bold text-[#000000] uppercase tracking-wider">
          COMPATIBILITY BREAKDOWN
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 font-mono text-xs">
          {/* Interests */}
          <div className="p-2.5 bg-[#FAFAFA] border border-[#E5E5E5] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[#333333] font-bold">
                <Target className="w-3.5 h-3.5 text-[#F97316]" />
                <span>Interests</span>
              </span>
              <span className="font-black text-[#000000]">{match.interests}%</span>
            </div>
            <div className="w-full bg-[#E5E5E5] h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full ${getBarColor(match.interests)} transition-all duration-500`}
                style={{ width: `${match.interests}%` }}
              />
            </div>
          </div>

          {/* Skills */}
          <div className="p-2.5 bg-[#FAFAFA] border border-[#E5E5E5] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[#333333] font-bold">
                <Wrench className="w-3.5 h-3.5 text-[#2563EB]" />
                <span>Skills</span>
              </span>
              <span className="font-black text-[#000000]">{match.skills}%</span>
            </div>
            <div className="w-full bg-[#E5E5E5] h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full ${getBarColor(match.skills)} transition-all duration-500`}
                style={{ width: `${match.skills}%` }}
              />
            </div>
          </div>

          {/* Events */}
          <div className="p-2.5 bg-[#FAFAFA] border border-[#E5E5E5] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[#333333] font-bold">
                <Ticket className="w-3.5 h-3.5 text-[#16A34A]" />
                <span>Events Attending</span>
              </span>
              <span className="font-black text-[#000000]">{match.events}%</span>
            </div>
            <div className="w-full bg-[#E5E5E5] h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full ${getBarColor(match.events)} transition-all duration-500`}
                style={{ width: `${match.events}%` }}
              />
            </div>
          </div>

          {/* Location */}
          <div className="p-2.5 bg-[#FAFAFA] border border-[#E5E5E5] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[#333333] font-bold">
                <MapPin className="w-3.5 h-3.5 text-[#DC2626]" />
                <span>Location Hub</span>
              </span>
              <span className="font-black text-[#000000]">{match.location}%</span>
            </div>
            <div className="w-full bg-[#E5E5E5] h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full ${getBarColor(match.location)} transition-all duration-500`}
                style={{ width: `${match.location}%` }}
              />
            </div>
          </div>

          {/* Network */}
          <div className="p-2.5 bg-[#FAFAFA] border border-[#E5E5E5] space-y-1.5 sm:col-span-2">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[#333333] font-bold">
                <Users className="w-3.5 h-3.5 text-[#9333EA]" />
                <span>Network Synergy</span>
              </span>
              <span className="font-black text-[#000000]">{match.network}%</span>
            </div>
            <div className="w-full bg-[#E5E5E5] h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full ${getBarColor(match.network)} transition-all duration-500`}
                style={{ width: `${match.network}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* WHY YOU MATCH */}
      <div className="bg-[#FAF5FF] border border-[#E9D5FF] p-4 space-y-2.5">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#7E22CE]" />
          <span className="font-mono text-xs font-black uppercase text-[#581C87] tracking-wider">
            WHY YOU MATCH
          </span>
        </div>

        <ul className="space-y-1.5">
          {match.reasons.map((reason, idx) => (
            <li key={idx} className="flex items-start gap-2 text-xs text-[#3B0764] font-sans">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#9333EA] shrink-0 mt-0.5" />
              <span>{reason}</span>
            </li>
          ))}
        </ul>

        {/* Shared tags */}
        {(match.sharedInterests.length > 0 || match.sharedSkills.length > 0) && (
          <div className="pt-2 border-t border-[#E9D5FF]/60 flex flex-wrap gap-1.5">
            {match.sharedInterests.map((item, idx) => (
              <span
                key={`int-${idx}`}
                className="font-mono text-[10px] font-bold bg-[#FFFFFF] border border-[#D8B4FE] text-[#6B21A8] px-2 py-0.5"
              >
                ✦ {item}
              </span>
            ))}
            {match.sharedSkills.map((item, idx) => (
              <span
                key={`sk-${idx}`}
                className="font-mono text-[10px] font-bold bg-[#FFFFFF] border border-[#CBD5E1] text-[#334155] px-2 py-0.5"
              >
                🛠️ {item}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
