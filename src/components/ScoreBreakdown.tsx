import React, { useState } from 'react';
import { SignalScore } from '../types';
import { ShieldCheck, Cpu, Layers, Activity, FileCode2, ChevronDown, ChevronUp } from 'lucide-react';

interface ScoreBreakdownProps {
  signals: {
    c2pa: SignalScore;
    aiEnsemble: SignalScore;
    ela: SignalScore;
    frequency: SignalScore;
    metadata: SignalScore;
  };
}

export const ScoreBreakdown: React.FC<ScoreBreakdownProps> = ({ signals }) => {
  const [expandedSignal, setExpandedSignal] = useState<string | null>(null);

  const signalList = [
    {
      key: 'c2pa',
      data: signals.c2pa,
      icon: ShieldCheck,
      color: 'text-indigo-400',
      whatItCatches: 'Cryptographically signed provenance tokens (Adobe, DALL-E, Firefly, Microsoft)',
      howItWorks: 'Checks for valid C2PA / JUMBF cryptographic manifest assertions. Direct AI disclosure triggers an immediate score override.',
    },
    {
      key: 'aiEnsemble',
      data: signals.aiEnsemble,
      icon: Cpu,
      color: 'text-cyan-400',
      whatItCatches: 'Diffusion & GAN synthetic generator texture signatures',
      howItWorks: 'Ensemble average across 2–3 full-size Hugging Face PyTorch classifiers (sdxl-detector, AI-image-detector, ai-vs-human).',
    },
    {
      key: 'ela',
      data: signals.ela,
      icon: Layers,
      color: 'text-sky-400',
      whatItCatches: 'Localized tampering, splicing, clone-stamping, and selective inpainting',
      howItWorks: 'Multi-scale JPEG re-compression (75, 85, 95) with statistical Z-score block variance thresholding.',
    },
    {
      key: 'frequency',
      data: signals.frequency,
      icon: Activity,
      color: 'text-amber-400',
      whatItCatches: 'Periodic grid harmonics & convolution upsampling artifacts',
      howItWorks: '2D Fast Fourier Transform on pixel luminance evaluating radial power spectrum against optical 1/f decay curves.',
    },
    {
      key: 'metadata',
      data: signals.metadata,
      icon: FileCode2,
      color: 'text-emerald-400',
      whatItCatches: 'Stripped EXIF, missing camera hardware tags, and AI software leaks',
      howItWorks: 'Deep binary header parsing for camera hardware make/model, exposure parameters, and generative AI software tags.',
    },
  ];

  const getScoreColor = (score: number) => {
    if (score >= 80) return { bar: 'bg-emerald-500', text: 'text-emerald-400', badge: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' };
    if (score >= 60) return { bar: 'bg-sky-500', text: 'text-sky-400', badge: 'bg-sky-500/10 text-sky-300 border-sky-500/20' };
    if (score >= 35) return { bar: 'bg-amber-500', text: 'text-amber-400', badge: 'bg-amber-500/10 text-amber-300 border-amber-500/20' };
    return { bar: 'bg-red-500', text: 'text-red-400', badge: 'bg-red-500/10 text-red-300 border-red-500/20' };
  };

  return (
    <div id="score-breakdown-panel" className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-mono uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
          <span>5-Signal Calibrated Breakdown</span>
          <span className="text-[10px] text-neutral-500">(Sum = 100)</span>
        </h4>
        <span className="text-[11px] text-neutral-400">Click signal for details</span>
      </div>

      <div className="space-y-2.5">
        {signalList.map((item) => {
          const Icon = item.icon;
          const { score, weight, name, summary, details, metrics } = item.data;
          const colors = getScoreColor(score);
          const isExpanded = expandedSignal === item.key;

          return (
            <div
              key={item.key}
              id={`signal-card-${item.key}`}
              className="rounded-lg bg-neutral-900/70 border border-neutral-800 hover:border-neutral-700 transition-colors overflow-hidden"
            >
              <button
                type="button"
                onClick={() => setExpandedSignal(isExpanded ? null : item.key)}
                className="w-full p-3 text-left flex flex-col gap-2 cursor-pointer focus:outline-none"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="p-1.5 rounded-md bg-neutral-800 text-neutral-300 shrink-0">
                      <Icon className={`w-4 h-4 ${item.color}`} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-neutral-200 truncate">{name}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400 shrink-0">
                          Weight: {weight}%
                        </span>
                      </div>
                      <p className="text-xs text-neutral-400 truncate">{summary}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${colors.badge}`}>
                      {score}/100
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-neutral-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-neutral-400" />
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${colors.bar}`}
                    style={{ width: `${Math.max(3, score)}%` }}
                  />
                </div>
              </button>

              {/* Expanded Technical Details */}
              {isExpanded && (
                <div className="px-3 pb-3 pt-1 border-t border-neutral-800/80 bg-neutral-950/40 text-xs space-y-2">
                  <div>
                    <span className="text-[11px] font-semibold text-neutral-300 block mb-0.5">What it catches:</span>
                    <p className="text-neutral-400 text-[11px] leading-relaxed">{item.whatItCatches}</p>
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-neutral-300 block mb-0.5">Backend Methodology:</span>
                    <p className="text-neutral-400 text-[11px] leading-relaxed">{item.howItWorks}</p>
                  </div>
                  {details && (
                    <div className="p-2 rounded bg-neutral-900 border border-neutral-800 font-mono text-[10px] text-neutral-300">
                      {details}
                    </div>
                  )}

                  {metrics && Object.keys(metrics).length > 0 && (
                    <div className="pt-1">
                      <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block mb-1">
                        Diagnostic Metrics
                      </span>
                      <div className="grid grid-cols-2 gap-1.5">
                        {Object.entries(metrics).map(([k, v]) => (
                          <div key={k} className="p-1.5 rounded bg-neutral-900/90 border border-neutral-800/80 text-[10px]">
                            <span className="text-neutral-400 block truncate">{k}</span>
                            <span className="font-mono text-neutral-200 truncate block">
                              {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
