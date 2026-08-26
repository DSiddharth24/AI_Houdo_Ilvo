export const SIGNAL_WEIGHTS = {
  c2pa: 30,
  aiEnsemble: 35,
  ela: 20,
  frequency: 10,
  metadata: 5,
} as const;

export const VERDICT_DEFINITIONS = {
  genuine: {
    band: 'genuine',
    verdict: 'Genuine / Real',
    kannada: 'Fully Nija guru ✅',
    english: 'Completely Genuine Photo',
    description: 'Passed all forensic and provenance checks: authentic camera noise floor, uniform error level distribution, and natural sensor dynamics.',
  },
  touched_up: {
    band: 'touched_up',
    verdict: 'Filtered / Lightly Retouched',
    kannada: 'Thumba filter hodidiya? 🤨 (touched up much?)',
    english: 'Filtered / Lightly Retouched',
    description: 'Base capture appears authentic, but subtle post-processing, color grading, face filters, or slight smoothing adjustments were detected.',
  },
  edited: {
    band: 'edited',
    verdict: 'Edited / Composite',
    kannada: 'Idu edit maadidru guru 🔍 (this one\'s been edited)',
    english: 'Edited / Composite Splicing',
    description: 'Localized tampering or image splicing detected. Error Level Analysis shows significant variance discrepancies between spliced regions and base background.',
  },
  ai_generated: {
    band: 'ai_generated',
    verdict: 'AI-Generated / Synthetic',
    kannada: 'Machine maadidhu guru 🚨 (a machine made this)',
    english: 'Synthetic / AI-Generated',
    description: 'High AI-generation model confidence, characteristic diffusion/GAN high-frequency spectral artifacts, or generative provenance manifest detected.',
  },
} as const;

export function calculateCompositeNijaScore(signals: {
  c2paScore: number;
  aiEnsembleScore: number;
  elaScore: number;
  frequencyScore: number;
  metadataScore: number;
  c2paAiDisclosed?: boolean;
}): {
  nijaScore: number;
  verdictInfo: typeof VERDICT_DEFINITIONS[keyof typeof VERDICT_DEFINITIONS];
  caveats: string[];
} {
  const { c2paScore, aiEnsembleScore, elaScore, frequencyScore, metadataScore, c2paAiDisclosed } = signals;
  const caveats: string[] = [];

  // Direct C2PA AI disclosure hard override
  if (c2paAiDisclosed) {
    caveats.push('Cryptographically verified AI generation assertion present in C2PA manifest box.');
    return {
      nijaScore: Math.min(10, c2paScore),
      verdictInfo: VERDICT_DEFINITIONS.ai_generated,
      caveats,
    };
  }

  const cC2pa = Math.max(0, Math.min(100, c2paScore));
  const cAi = Math.max(0, Math.min(100, aiEnsembleScore));
  const cEla = Math.max(0, Math.min(100, elaScore));
  const cFreq = Math.max(0, Math.min(100, frequencyScore));
  const cMeta = Math.max(0, Math.min(100, metadataScore));

  const weightedSum =
    (cC2pa * SIGNAL_WEIGHTS.c2pa +
      cAi * SIGNAL_WEIGHTS.aiEnsemble +
      cEla * SIGNAL_WEIGHTS.ela +
      cFreq * SIGNAL_WEIGHTS.frequency +
      cMeta * SIGNAL_WEIGHTS.metadata) /
    100;

  const nijaScore = Math.round(weightedSum);

  // Cross-signal checks
  if (cAi < 35 && cEla > 75) {
    caveats.push('Uniform JPEG surface but synthetic microtexture detected (consistent with pure AI diffusion).');
  }
  if (cEla < 40 && cAi > 70) {
    caveats.push('Authentic base photo with localized spliced or inpainted elements.');
  }

  let verdictInfo: typeof VERDICT_DEFINITIONS[keyof typeof VERDICT_DEFINITIONS];
  if (nijaScore >= 85) {
    verdictInfo = VERDICT_DEFINITIONS.genuine;
  } else if (nijaScore >= 60) {
    verdictInfo = VERDICT_DEFINITIONS.touched_up;
  } else if (nijaScore >= 30) {
    verdictInfo = VERDICT_DEFINITIONS.edited;
  } else {
    verdictInfo = VERDICT_DEFINITIONS.ai_generated;
  }

  return { nijaScore, verdictInfo, caveats };
}
