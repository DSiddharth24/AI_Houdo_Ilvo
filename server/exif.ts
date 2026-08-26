import exifr from 'exifr';

export interface ExifResult {
  score: number;
  detail: string;
  has_exif: boolean;
  camera_make?: string;
  camera_model?: string;
  software?: string;
  detected_ai_software?: string;
  tags_count: number;
  gps_present: boolean;
  social_compression_suspected: boolean;
  tags: Record<string, any>;
}

export async function checkExifMetadata(
  buffer: Buffer,
  filename: string = 'image.jpg'
): Promise<ExifResult> {
  const lowerName = filename.toLowerCase();
  const filenameHasAiCue =
    lowerName.includes('chatgpt') ||
    lowerName.includes('dall-e') ||
    lowerName.includes('dalle') ||
    lowerName.includes('midjourney') ||
    lowerName.includes('comfyui') ||
    lowerName.includes('stablediffusion') ||
    lowerName.includes('firefly') ||
    lowerName.includes('flux_');

  try {
    const rawTags = await exifr.parse(buffer, {
      tiff: true,
      xmp: true,
      icc: true,
      iptc: true,
      jfif: true,
      exif: true,
      gps: true,
    });

    if (!rawTags || Object.keys(rawTags).length === 0) {
      if (filenameHasAiCue) {
        return {
          score: 5,
          detail: `AI image export format confirmed via filename provenance ("${filename}").`,
          has_exif: false,
          detected_ai_software: 'OpenAI / ChatGPT',
          tags_count: 0,
          gps_present: false,
          social_compression_suspected: false,
          tags: {},
        };
      }

      return {
        score: 55,
        detail: 'No EXIF metadata found (Common for AI generations or social media re-uploads).',
        has_exif: false,
        tags_count: 0,
        gps_present: false,
        social_compression_suspected: true,
        tags: {},
      };
    }

    const tagsCount = Object.keys(rawTags).length;
    const make = rawTags.Make || rawTags.make;
    const model = rawTags.Model || rawTags.model;
    const software = rawTags.Software || rawTags.software || rawTags.creator || rawTags.Creator;
    const hasGps = !!(rawTags.latitude || rawTags.longitude || rawTags.GPSLatitude);

    // AI software signature detection
    let detectedAiSoftware: string | undefined;
    const softwareStr = String(software || '').toLowerCase();
    const allTagsStr = JSON.stringify(rawTags).toLowerCase();

    const aiSignatures = [
      'midjourney',
      'stable diffusion',
      'dall-e',
      'chatgpt',
      'novelai',
      'comfyui',
      'automatic1111',
      'fooocus',
      'invokeai',
      'adobe firefly',
    ];

    for (const sig of aiSignatures) {
      if (softwareStr.includes(sig) || allTagsStr.includes(sig) || (filenameHasAiCue && lowerName.includes(sig))) {
        detectedAiSoftware = sig.toUpperCase();
        break;
      }
    }

    if (detectedAiSoftware) {
      return {
        score: 5,
        detail: `Leaked AI generation software tag detected in metadata: ${detectedAiSoftware}`,
        has_exif: true,
        camera_make: make,
        camera_model: model,
        software: software,
        detected_ai_software: detectedAiSoftware,
        tags_count: tagsCount,
        gps_present: hasGps,
        social_compression_suspected: false,
        tags: sanitizeTags(rawTags),
      };
    }

    let score = 70;
    if (make && model) {
      score = 95; // Hardware camera confirmed
    } else if (software && (softwareStr.includes('photoshop') || softwareStr.includes('lightroom') || softwareStr.includes('gimp'))) {
      score = 50; // Digital editor signature
    } else if (tagsCount > 10) {
      score = 80;
    }

    let detail: string;
    if (make && model) {
      detail = `Hardware camera capture confirmed (${make} ${model}); ISO: ${rawTags.ISO || 'Auto'}, f/${rawTags.FNumber || 'N/A'}.`;
    } else if (software) {
      detail = `Digital editing application header detected (${software}).`;
    } else {
      detail = `Found ${tagsCount} metadata headers without explicit hardware make/model tags.`;
    }

    return {
      score,
      detail,
      has_exif: true,
      camera_make: make,
      camera_model: model,
      software: software,
      tags_count: tagsCount,
      gps_present: hasGps,
      social_compression_suspected: false,
      tags: sanitizeTags(rawTags),
    };
  } catch (err) {
    return {
      score: filenameHasAiCue ? 5 : 50,
      detail: filenameHasAiCue
        ? `AI image generator signature detected in filename "${filename}".`
        : 'Metadata parsing encountered an issue or stripped headers.',
      has_exif: false,
      tags_count: 0,
      gps_present: false,
      social_compression_suspected: true,
      tags: {},
    };
  }
}

function sanitizeTags(tags: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  const allowedKeys = [
    'Make',
    'Model',
    'Software',
    'ISO',
    'FNumber',
    'ExposureTime',
    'FocalLength',
    'CreateDate',
    'ModifyDate',
    'LensModel',
    'ColorSpace',
    'Flash',
    'WhiteBalance',
    'latitude',
    'longitude',
  ];

  for (const key of allowedKeys) {
    if (tags[key] !== undefined) {
      result[key] = typeof tags[key] === 'object' ? JSON.stringify(tags[key]) : tags[key];
    }
  }

  return result;
}
