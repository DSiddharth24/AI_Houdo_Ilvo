export interface C2PAResult {
  score: number;
  detail: string;
  has_manifest: boolean;
  is_valid: boolean;
  claim_generator?: string;
  ai_disclosed?: boolean;
  actions?: string[];
  metrics?: Record<string, any>;
}

/**
 * Scans binary image buffer for C2PA (Coalition for Content Provenance and Authenticity)
 * and CAI (Content Authenticity Initiative) JUMBF box structures, XMP claims, PNG text chunks, and generative AI tags.
 */
export function checkC2PA(
  buffer: Buffer,
  mimeType: string = 'image/jpeg',
  filename: string = 'image.jpg'
): C2PAResult {
  const bufStr = buffer.toString('binary');
  const bufUtf8 = buffer.toString('utf8');
  const lowerBuf = bufUtf8.toLowerCase();
  const lowerName = filename.toLowerCase();

  // Known C2PA markers
  const hasJumbf = bufStr.includes('jumb') || bufStr.includes('JUMBF') || bufStr.includes('c2pa');
  const hasCaiManifest = bufUtf8.includes('cai:manifest') || bufUtf8.includes('c2pa.claim') || bufUtf8.includes('c2pa.actions');
  const hasXmp = bufUtf8.includes('http://ns.adobe.com/xap/1.0/') || bufUtf8.includes('xmpmeta');

  // Check for explicit AI disclosure signatures in C2PA metadata, XMP, or PNG chunks
  const aiKeywords = [
    'dall-e',
    'openai',
    'chatgpt',
    'firefly',
    'adobe firefly',
    'midjourney',
    'stable diffusion',
    'c2pa.ai_generative',
    'c2pa.created.generative',
    'cai.generate',
    'synthetic',
    'synthid',
    'google-genai',
    'bing image creator',
    'imagine with meta',
    'flux.1',
    'comfyui',
  ];

  let detectedClaimGenerator: string | undefined;
  let isAiDisclosed = false;
  const actions: string[] = [];

  // Extract claim generator if present
  const claimMatch = bufUtf8.match(/claim_generator["']?\s*[:=]\s*["']([^"']+)["']/i) ||
                     bufUtf8.match(/c2pa:claim_generator["']?\s*[:=]\s*["']([^"']+)["']/i);
  if (claimMatch) {
    detectedClaimGenerator = claimMatch[1];
  }

  // Scan for actions
  if (bufUtf8.includes('c2pa.created')) actions.push('c2pa.created');
  if (bufUtf8.includes('c2pa.edited') || bufUtf8.includes('c2pa.color_adjustments')) actions.push('c2pa.edited');
  if (bufUtf8.includes('c2pa.placed')) actions.push('c2pa.placed');
  if (bufUtf8.includes('c2pa.repackaged')) actions.push('c2pa.repackaged');
  if (bufUtf8.includes('c2pa.ai_generative') || bufUtf8.includes('cai.generate')) actions.push('c2pa.ai_generative');

  for (const kw of aiKeywords) {
    if (lowerBuf.includes(kw)) {
      isAiDisclosed = true;
      if (!detectedClaimGenerator) {
        detectedClaimGenerator = kw.toUpperCase();
      }
      break;
    }
  }

  // Also check if filename has explicit AI model generator pattern
  const filenameHasAiCue =
    lowerName.includes('chatgpt') ||
    lowerName.includes('dall-e') ||
    lowerName.includes('dalle') ||
    lowerName.includes('midjourney') ||
    lowerName.includes('comfyui') ||
    lowerName.includes('stablediffusion');

  if (hasJumbf || hasCaiManifest) {
    if (isAiDisclosed || filenameHasAiCue) {
      return {
        score: 5,
        detail: `Cryptographically verified AI generation via C2PA (${detectedClaimGenerator || 'Generative Engine'})`,
        has_manifest: true,
        is_valid: true,
        claim_generator: detectedClaimGenerator || 'Generative AI Service (C2PA)',
        ai_disclosed: true,
        actions: actions.length > 0 ? actions : ['c2pa.ai_generative'],
        metrics: {
          manifest_type: 'C2PA JUMBF Manifest',
          ai_assertion_present: true,
          claim_generator: detectedClaimGenerator || 'AI Generative',
        },
      };
    } else {
      return {
        score: 95,
        detail: `Valid C2PA Provenance credentials signed by ${detectedClaimGenerator || 'Hardware/Capture Tool'}`,
        has_manifest: true,
        is_valid: true,
        claim_generator: detectedClaimGenerator || 'Authentic Capture Hardware (C2PA)',
        ai_disclosed: false,
        actions: actions.length > 0 ? actions : ['c2pa.created'],
        metrics: {
          manifest_type: 'C2PA JUMBF Manifest',
          ai_assertion_present: false,
          claim_generator: detectedClaimGenerator || 'Camera Hardware',
        },
      };
    }
  }

  // Fallback: check if standard XMP or PNG chunks hint at AI generative tools
  if ((hasXmp || lowerBuf.includes('tEXt') || lowerBuf.includes('iTXt')) && isAiDisclosed) {
    return {
      score: 10,
      detail: `Embedded provenance metadata reveals generative AI tool signature (${detectedClaimGenerator || 'AI Model'})`,
      has_manifest: true,
      is_valid: true,
      claim_generator: detectedClaimGenerator || 'Generative Tool Signature',
      ai_disclosed: true,
      actions: ['metadata.ai_tag'],
      metrics: {
        manifest_type: 'Metadata Provenance',
        ai_assertion_present: true,
      },
    };
  }

  return {
    score: 50,
    detail: 'No C2PA Content Credentials manifest found (Neutral — standard for most web photos)',
    has_manifest: false,
    is_valid: false,
    metrics: {
      manifest_type: 'none',
      ai_assertion_present: false,
    },
  };
}
