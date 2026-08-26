import exifr from 'exifr';
import { ExifReport } from '../types';

const AI_SOFTWARE_PATTERNS = [
  { name: 'Midjourney', regex: /midjourney/i },
  { name: 'Stable Diffusion', regex: /stable[-_\s]?diffusion|automatic1111|comfyui|invokeai|civitai|novelai/i },
  { name: 'DALL-E', regex: /dall[-_\s]?e/i },
  { name: 'Adobe Firefly', regex: /firefly/i },
  { name: 'Imagen', regex: /imagen/i },
  { name: 'Bing Image Creator', regex: /bing\simage\screator/i },
];

const PHOTO_EDITING_PATTERNS = [
  { name: 'Adobe Photoshop', regex: /photoshop/i },
  { name: 'GIMP', regex: /gimp/i },
  { name: 'Affinity Photo', regex: /affinity/i },
  { name: 'Canva', regex: /canva/i },
  { name: 'PicsArt', regex: /picsart/i },
  { name: 'FaceApp', regex: /faceapp/i },
  { name: 'Snapseed', regex: /snapseed/i },
  { name: 'Lightroom', regex: /lightroom/i },
];

export async function analyzeMetadata(fileOrBlob: Blob | File | ArrayBuffer): Promise<ExifReport> {
  const notes: string[] = [];
  let score = 50; // Neutral baseline when EXIF is absent/stripped
  let hasExif = false;
  let rawTagsCount = 0;
  let allTags: Record<string, any> = {};

  try {
    const parsed = await exifr.parse(fileOrBlob, {
      tiff: true,
      xmp: true,
      icc: true,
      iptc: true,
      jfif: true,
      exif: true,
      gps: true,
      mergeOutput: true,
    });

    if (parsed && typeof parsed === 'object') {
      allTags = parsed;
      rawTagsCount = Object.keys(parsed).length;
      hasExif = rawTagsCount > 0;
    }
  } catch (err) {
    notes.push('Could not parse standard EXIF segments or image has zero header metadata.');
  }

  if (!hasExif || rawTagsCount === 0) {
    notes.push('No camera EXIF metadata detected (common in AI exports and compressed social media images).');
    return {
      score: 45, // Web/stripped neutral penalty
      hasExif: false,
      rawTagsCount: 0,
      tags: {},
      integrityNotes: notes,
    };
  }

  const cameraMake = allTags.Make ? String(allTags.Make).trim() : undefined;
  const cameraModel = allTags.Model ? String(allTags.Model).trim() : undefined;
  const lensModel = allTags.LensModel || allTags.LensInfo ? String(allTags.LensModel || allTags.LensInfo).trim() : undefined;
  const software = allTags.Software ? String(allTags.Software).trim() : undefined;
  const createDate = allTags.CreateDate || allTags.DateTimeOriginal ? String(allTags.CreateDate || allTags.DateTimeOriginal) : undefined;
  const modifyDate = allTags.ModifyDate ? String(allTags.ModifyDate) : undefined;
  const iso = allTags.ISO || allTags.ISOSpeedRatings ? Number(allTags.ISO || allTags.ISOSpeedRatings) : undefined;
  const fNumber = allTags.FNumber ? Number(allTags.FNumber) : undefined;
  const exposureTime = allTags.ExposureTime ? (typeof allTags.ExposureTime === 'number' ? `1/${Math.round(1 / allTags.ExposureTime)}s` : String(allTags.ExposureTime)) : undefined;
  const focalLength = allTags.FocalLength ? `${allTags.FocalLength}mm` : undefined;

  let gps: { latitude?: number; longitude?: number } | undefined = undefined;
  if (allTags.latitude !== undefined && allTags.longitude !== undefined) {
    gps = {
      latitude: Number(allTags.latitude),
      longitude: Number(allTags.longitude),
    };
  }

  // Check for AI software keywords across all string tags
  let detectedAiSoftware: string | undefined = undefined;
  const fullTextMetadata = JSON.stringify(allTags);

  for (const pattern of AI_SOFTWARE_PATTERNS) {
    if (pattern.regex.test(fullTextMetadata)) {
      detectedAiSoftware = pattern.name;
      break;
    }
  }

  // Check for Photo Editing software
  let detectedEditor: string | undefined = undefined;
  for (const pattern of PHOTO_EDITING_PATTERNS) {
    if (pattern.regex.test(fullTextMetadata)) {
      detectedEditor = pattern.name;
      break;
    }
  }

  // Calculate score based on findings
  if (detectedAiSoftware) {
    score = 5;
    notes.push(`Direct AI signature detected in metadata tag: "${detectedAiSoftware}".`);
  } else {
    let scoreAccumulator = 50;

    // Has recognized camera make & model
    if (cameraMake || cameraModel) {
      scoreAccumulator += 25;
      notes.push(`Camera hardware detected: ${cameraMake || ''} ${cameraModel || ''}`.trim());
    }

    // Has physical capture exposure settings (ISO, F-number, Focal length, Shutter)
    if (iso !== undefined || fNumber !== undefined || exposureTime !== undefined || focalLength !== undefined) {
      scoreAccumulator += 15;
      notes.push('Authentic optical sensor exposure parameters found (ISO, Aperture, Shutter).');
    }

    // Has GPS coordinates
    if (gps && gps.latitude !== undefined) {
      scoreAccumulator += 10;
      notes.push('Geotagged GPS hardware coordinates present.');
    }

    // Has timestamp consistency
    if (createDate) {
      scoreAccumulator += 5;
      notes.push(`Original capture timestamp: ${createDate}`);
    }

    // Penalize if photo editing software is recorded
    if (detectedEditor) {
      if (detectedEditor === 'Adobe Photoshop' || detectedEditor === 'GIMP') {
        scoreAccumulator -= 20;
        notes.push(`Editing suite signature detected: ${detectedEditor}.`);
      } else if (detectedEditor === 'Lightroom' || detectedEditor === 'Snapseed') {
        scoreAccumulator -= 10;
        notes.push(`Color grading application noted: ${detectedEditor}.`);
      }
    }

    score = Math.max(10, Math.min(100, scoreAccumulator));
  }

  return {
    score,
    hasExif: true,
    cameraMake,
    cameraModel,
    lensModel,
    software,
    createDate,
    modifyDate,
    iso,
    fNumber,
    exposureTime,
    focalLength,
    gps,
    detectedAiSoftware,
    rawTagsCount,
    tags: allTags,
    integrityNotes: notes,
  };
}
