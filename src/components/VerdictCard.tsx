import React from 'react';
import { VerdictInfo } from '../types';
import { ShieldCheck, ShieldAlert, Sparkles, Sliders, HelpCircle, AlertCircle } from 'lucide-react';

interface VerdictCardProps {
  verdict: VerdictInfo;
  nijaScore: number;
  compact?: boolean;
  caveats?: string[];
}

export const VerdictCard: React.FC<VerdictCardProps> = ({
  verdict,
  nijaScore,
  compact = false,
  caveats = [],
}) => {
  const getIcon = () => {
    switch (verdict.band) {
      case 'genuine':
        return <ShieldCheck className="w-5 h-5 text-emerald-400" />;
      case 'touched_up':
        return <Sliders className="w-5 h-5 text-sky-400" />;
      case 'edited':
        return <Sparkles className="w-5 h-5 text-amber-400" />;
      case 'ai_generated':
        return <ShieldAlert className="w-5 h-5 text-red-400" />;
      case 'inconclusive':
      default:
        return <HelpCircle className="w-5 h-5 text-purple-400" />;
    }
  };

  if (compact) {
    return (
      <div
        id={`verdict-badge-${verdict.band}`}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${verdict.badgeBg} ${verdict.badgeBorder} ${verdict.badgeText}`}
      >
        {getIcon()}
        <span className="truncate">{verdict.kannadaLabel.split('(')[0].trim()}</span>
      </div>
    );
  }

  return (
    <div
      id="verdict-card-container"
      className={`relative overflow-hidden rounded-xl border p-4 sm:p-5 ${verdict.badgeBg} ${verdict.badgeBorder}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1.5 flex-1">
          <div className="flex items-center gap-2">
            {getIcon()}
            <span className="text-xs font-mono uppercase tracking-wider text-neutral-400">
              Composite Verdict (ತೀರ್ಪು)
            </span>
          </div>

          <h3 className="text-lg sm:text-xl font-bold font-kannada tracking-tight text-white flex flex-wrap items-center gap-2">
            <span>{verdict.kannadaLabel}</span>
          </h3>

          <p className="text-sm font-medium text-neutral-300">
            {verdict.englishTranslation}
          </p>

          <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed pt-1">
            {verdict.description}
          </p>

          {caveats && caveats.length > 0 && (
            <div className="pt-2 space-y-1">
              {caveats.map((c, i) => (
                <div key={i} className="flex items-center gap-1.5 text-[11px] text-amber-300/90 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                  <span>{c}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-neutral-900/60 border border-neutral-800 shrink-0">
          <span className="text-[10px] font-mono uppercase text-neutral-400">Nija Score</span>
          <span className={`text-2xl sm:text-3xl font-extrabold font-mono ${verdict.badgeText}`}>
            {nijaScore}
          </span>
          <span className="text-[10px] text-neutral-500">/ 100</span>
        </div>
      </div>
    </div>
  );
};
