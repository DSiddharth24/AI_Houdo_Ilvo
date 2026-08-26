import { VerdictBandId, VerdictInfo } from '../types';

export const BACKEND_SIGNAL_WEIGHTS = {
  c2pa: 25,
  aiEnsemble: 40,
  ela: 20,
  frequency: 10,
  metadata: 5,
} as const;

export const VERDICT_BANDS: Record<VerdictBandId, VerdictInfo> = {
  genuine: {
    band: 'genuine',
    kannadaLabel: 'Fully Nija guru ✅',
    englishTranslation: 'Completely Genuine Photo',
    description: 'Passed all forensic and provenance checks: authentic camera noise floor, uniform error level distribution, and natural sensor dynamics.',
    color: '#10b981', // emerald-500
    badgeBg: 'bg-emerald-500/10',
    badgeBorder: 'border-emerald-500/30',
    badgeText: 'text-emerald-400',
    minScore: 85,
    maxScore: 100,
  },
  touched_up: {
    band: 'touched_up',
    kannadaLabel: 'Thumba filter hodidiya? 🤨 (touched up much?)',
    englishTranslation: 'Filtered / Lightly Retouched',
    description: 'Base capture appears authentic, but subtle post-processing, color grading, face filters, or slight smoothing adjustments were detected across the image.',
    color: '#38bdf8', // sky-400
    badgeBg: 'bg-sky-500/10',
    badgeBorder: 'border-sky-500/30',
    badgeText: 'text-sky-400',
    minScore: 60,
    maxScore: 84,
  },
  edited: {
    band: 'edited',
    kannadaLabel: 'Idu edit maadidru guru 🔍 (this one\'s been edited)',
    englishTranslation: 'Edited / Composite Splicing',
    description: 'Localized tampering or image splicing detected. Error Level Analysis shows significant variance discrepancies between spliced regions and base background.',
    color: '#f59e0b', // amber-500
    badgeBg: 'bg-amber-500/10',
    badgeBorder: 'border-amber-500/30',
    badgeText: 'text-amber-400',
    minScore: 30,
    maxScore: 59,
  },
  ai_generated: {
    band: 'ai_generated',
    kannadaLabel: 'Machine maadidhu guru 🚨 (a machine made this)',
    englishTranslation: 'Synthetic / AI-Generated',
    description: 'High AI-generation model confidence, characteristic diffusion/GAN high-frequency spectral artifacts, or generative provenance manifest detected.',
    color: '#ef4444', // red-500
    badgeBg: 'bg-red-500/10',
    badgeBorder: 'border-red-500/30',
    badgeText: 'text-red-400',
    minScore: 0,
    maxScore: 29,
  },
  inconclusive: {
    band: 'inconclusive',
    kannadaLabel: 'Confirm illa guru 🤷 (can\'t confirm)',
    englishTranslation: 'Inconclusive / Mixed Signals',
    description: 'Forensic signals exhibit high disagreement or heavy re-compression prevents definitive single classification.',
    color: '#a855f7', // purple-500
    badgeBg: 'bg-purple-500/10',
    badgeBorder: 'border-purple-500/30',
    badgeText: 'text-purple-400',
    minScore: 0,
    maxScore: 100,
  },
};

/**
 * Calculates the composite Nija Score (0 - 100) using calibrated forensic rules
 */
export function calculate5SignalNijaScore(signals: {
  c2paScore: number;
  aiEnsembleScore: number;
  elaScore: number;
  frequencyScore: number;
  metadataScore: number;
  c2paAiDisclosed?: boolean;
  isAiGenerated?: boolean;
  aiLikelihoodPct?: number;
}): { nijaScore: number; verdict: VerdictInfo } {
  const {
    c2paScore,
    aiEnsembleScore,
    elaScore,
    frequencyScore,
    metadataScore,
    c2paAiDisclosed,
    isAiGenerated,
    aiLikelihoodPct,
  } = signals;

  if (c2paAiDisclosed) {
    return {
      nijaScore: Math.min(10, Math.max(2, c2paScore)),
      verdict: VERDICT_BANDS.ai_generated,
    };
  }

  // Forensic Gating for AI generated images
  const isDefinitiveAi =
    isAiGenerated ||
    aiEnsembleScore <= 35 ||
    (typeof aiLikelihoodPct === 'number' && aiLikelihoodPct >= 65);

  if (isDefinitiveAi) {
    return {
      nijaScore: Math.min(25, Math.max(2, Math.round(aiEnsembleScore * 0.7))),
      verdict: VERDICT_BANDS.ai_generated,
    };
  }

  // Forensic Gating for Splicing / Compositing
  if (elaScore <= 35 && aiEnsembleScore >= 50) {
    return {
      nijaScore: Math.min(55, Math.max(30, Math.round(elaScore * 0.9 + 5))),
      verdict: VERDICT_BANDS.edited,
    };
  }

  const cC2pa = Math.max(0, Math.min(100, c2paScore));
  const cAi = Math.max(0, Math.min(100, aiEnsembleScore));
  const cEla = Math.max(0, Math.min(100, elaScore));
  const cFreq = Math.max(0, Math.min(100, frequencyScore));
  const cMeta = Math.max(0, Math.min(100, metadataScore));

  const weightedSum =
    (cC2pa * BACKEND_SIGNAL_WEIGHTS.c2pa +
      cAi * BACKEND_SIGNAL_WEIGHTS.aiEnsemble +
      cEla * BACKEND_SIGNAL_WEIGHTS.ela +
      cFreq * BACKEND_SIGNAL_WEIGHTS.frequency +
      cMeta * BACKEND_SIGNAL_WEIGHTS.metadata) /
    100;

  const nijaScore = Math.round(weightedSum);

  let verdict: VerdictInfo;
  if (nijaScore >= 85) {
    verdict = VERDICT_BANDS.genuine;
  } else if (nijaScore >= 60) {
    verdict = VERDICT_BANDS.touched_up;
  } else if (nijaScore >= 30) {
    verdict = VERDICT_BANDS.edited;
  } else {
    verdict = VERDICT_BANDS.ai_generated;
  }

  return { nijaScore, verdict };
}
