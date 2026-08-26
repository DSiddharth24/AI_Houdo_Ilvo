import { ELAReport } from '../types';

/**
 * Performs Error Level Analysis (ELA) on an image using Canvas API.
 * Re-compresses image at 90% JPEG quality, diffs against original, and measures block variance.
 */
export async function performELA(
  imageSource: HTMLImageElement | string,
  amplification: number = 15,
  quality: number = 0.90
): Promise<ELAReport> {
  const notes: string[] = [];

  // 1. Ensure image is loaded
  const img = await loadImage(imageSource);
  
  // Cap analysis dimension for performance while keeping fine detail
  const maxDim = 1200;
  let width = img.naturalWidth || img.width;
  let height = img.naturalHeight || img.height;

  if (width > maxDim || height > maxDim) {
    const scale = maxDim / Math.max(width, height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  // 2. Draw original onto canvas 1
  const origCanvas = document.createElement('canvas');
  origCanvas.width = width;
  origCanvas.height = height;
  const origCtx = origCanvas.getContext('2d', { willReadFrequently: true });
  if (!origCtx) throw new Error('Failed to get 2d context for ELA original canvas');
  origCtx.drawImage(img, 0, 0, width, height);
  const origData = origCtx.getImageData(0, 0, width, height);

  // 3. Compress original to JPEG Blob
  const jpegBlob = await new Promise<Blob>((resolve, reject) => {
    origCanvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to create JPEG blob for ELA'));
      },
      'image/jpeg',
      quality
    );
  });

  // 4. Load compressed JPEG onto canvas 2
  const jpegUrl = URL.createObjectURL(jpegBlob);
  const jpegImg = await loadImage(jpegUrl);
  URL.revokeObjectURL(jpegUrl);

  const compCanvas = document.createElement('canvas');
  compCanvas.width = width;
  compCanvas.height = height;
  const compCtx = compCanvas.getContext('2d', { willReadFrequently: true });
  if (!compCtx) throw new Error('Failed to get 2d context for ELA compressed canvas');
  compCtx.drawImage(jpegImg, 0, 0, width, height);
  const compData = compCtx.getImageData(0, 0, width, height);

  // 5. Compute difference and generate enhanced heatmap canvas
  const elaCanvas = document.createElement('canvas');
  elaCanvas.width = width;
  elaCanvas.height = height;
  const elaCtx = elaCanvas.getContext('2d');
  if (!elaCtx) throw new Error('Failed to get 2d context for ELA output canvas');
  const elaData = elaCtx.createImageData(width, height);

  const origPixels = origData.data;
  const compPixels = compData.data;
  const elaPixels = elaData.data;

  const totalPixels = width * height;
  let totalDiff = 0;

  // Track error map for 16x16 block variance analysis
  const blockSize = 16;
  const blocksX = Math.floor(width / blockSize);
  const blocksY = Math.floor(height / blockSize);
  const blockErrors: number[] = new Array(blocksX * blocksY).fill(0);
  const blockPixelCounts: number[] = new Array(blocksX * blocksY).fill(0);

  for (let i = 0; i < origPixels.length; i += 4) {
    const pixelIndex = i / 4;
    const x = pixelIndex % width;
    const y = Math.floor(pixelIndex / width);

    const dr = Math.abs(origPixels[i] - compPixels[i]);
    const dg = Math.abs(origPixels[i + 1] - compPixels[i + 1]);
    const db = Math.abs(origPixels[i + 2] - compPixels[i + 2]);

    const pixelDiff = (dr + dg + db) / 3;
    totalDiff += pixelDiff;

    // Record into block
    const bx = Math.floor(x / blockSize);
    const by = Math.floor(y / blockSize);
    if (bx < blocksX && by < blocksY) {
      const bIndex = by * blocksX + bx;
      blockErrors[bIndex] += pixelDiff;
      blockPixelCounts[bIndex] += 1;
    }

    // Amplify difference for visualization
    const amplifiedR = Math.min(255, dr * amplification);
    const amplifiedG = Math.min(255, dg * amplification);
    const amplifiedB = Math.min(255, db * amplification);

    elaPixels[i] = amplifiedR;
    elaPixels[i + 1] = amplifiedG;
    elaPixels[i + 2] = amplifiedB;
    elaPixels[i + 3] = 255;
  }

  elaCtx.putImageData(elaData, 0, 0);
  const elaImageDataUrl = elaCanvas.toDataURL('image/png');

  // 6. Compute block averages and variance
  const meanError = totalDiff / totalPixels;
  const validBlockAverages: number[] = [];

  for (let b = 0; b < blockErrors.length; b++) {
    if (blockPixelCounts[b] > 0) {
      validBlockAverages.push(blockErrors[b] / blockPixelCounts[b]);
    }
  }

  const blockCount = validBlockAverages.length;
  let variance = 0;
  let hotspotCount = 0;
  const hotspotThreshold = Math.max(8, meanError * 2.6);

  for (const avg of validBlockAverages) {
    variance += Math.pow(avg - meanError, 2);
    if (avg > hotspotThreshold) {
      hotspotCount++;
    }
  }

  variance = blockCount > 0 ? variance / blockCount : 0;
  const stdDev = Math.sqrt(variance);
  const hotspotRatio = blockCount > 0 ? hotspotCount / blockCount : 0;

  // 7. Calculate ELA Consistency Score (0 - 100)
  // Genuine unedited JPEGs exhibit uniform error distribution with stdDev proportional to image texture.
  // Spliced/edited pictures have isolated high-intensity spikes (hotspotRatio > 0.08 and high stdDev).
  let score = 90;

  if (meanError < 0.2) {
    // Extremely low compression error (e.g. uncompressed lossless vector or generated uniform surface)
    score = 75;
    notes.push('Near-zero compression residual detected (possible lossless rendering or synthetic graphic).');
  } else if (hotspotRatio > 0.12 || stdDev > 14) {
    // Heavy localized variance mismatch (typical of splicing/paste/inpaint)
    score = Math.max(15, Math.round(70 - hotspotRatio * 200 - stdDev * 2));
    notes.push(`High error level inconsistency (${hotspotCount} localized anomalous blocks detected), indicating composite edits or selective inpainting.`);
  } else if (hotspotRatio > 0.05 || stdDev > 8) {
    score = Math.max(45, Math.round(85 - stdDev * 3));
    notes.push('Moderate compression variation detected across textures and edges.');
  } else {
    score = Math.min(98, Math.round(92 - stdDev));
    notes.push('Error level response is consistent and homogeneous throughout the canvas structure.');
  }

  return {
    score,
    meanError: Math.round(meanError * 100) / 100,
    variance: Math.round(variance * 100) / 100,
    hotspotCount,
    maxErrorBlockRatio: Math.round(hotspotRatio * 1000) / 10,
    elaImageDataUrl,
    notes,
  };
}

function loadImage(src: string | HTMLImageElement): Promise<HTMLImageElement> {
  if (typeof src !== 'string') {
    if (src.complete && src.naturalWidth !== 0) return Promise.resolve(src);
    return new Promise((resolve, reject) => {
      src.onload = () => resolve(src);
      src.onerror = (e) => reject(e);
    });
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}
