export interface SampleImageOption {
  id: string;
  name: string;
  category: 'genuine' | 'ai_generated' | 'edited' | 'touched_up';
  kannadaHint: string;
  description: string;
  generate: () => Promise<File>;
}

/**
 * Creates a synthetic raw-like camera nature photograph (high organic noise, subtle optical gradients, simulated EXIF)
 */
async function generateRealPhoto(): Promise<File> {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 480;
  const ctx = canvas.getContext('2d')!;

  // Sky to mountain gradient
  const skyGrad = ctx.createLinearGradient(0, 0, 0, 300);
  skyGrad.addColorStop(0, '#3a7bd5');
  skyGrad.addColorStop(0.6, '#6dd5ed');
  skyGrad.addColorStop(1, '#f1c40f');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, 640, 480);

  // Mountain ridge
  ctx.fillStyle = '#2c3e50';
  ctx.beginPath();
  ctx.moveTo(0, 320);
  ctx.lineTo(120, 220);
  ctx.lineTo(240, 280);
  ctx.lineTo(380, 180);
  ctx.lineTo(520, 260);
  ctx.lineTo(640, 210);
  ctx.lineTo(640, 480);
  ctx.lineTo(0, 480);
  ctx.closePath();
  ctx.fill();

  // Natural organic noise & sensor grain
  const imgData = ctx.getImageData(0, 0, 640, 480);
  const p = imgData.data;
  for (let i = 0; i < p.length; i += 4) {
    const grain = (Math.random() - 0.5) * 14;
    p[i] = Math.max(0, Math.min(255, p[i] + grain));
    p[i + 1] = Math.max(0, Math.min(255, p[i + 1] + grain));
    p[i + 2] = Math.max(0, Math.min(255, p[i + 2] + grain));
  }
  ctx.putImageData(imgData, 0, 0);

  const blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.95));
  return new File([blob], 'canon_eos_r5_landscape.jpg', { type: 'image/jpeg' });
}

/**
 * Creates an AI synthetic diffusion style image with periodic upsampling grid harmonics and unnatural smooth skin/plastic glow
 */
async function generateAiArt(): Promise<File> {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Hyper-saturated cyberpunk neon synth gradient
  const grad = ctx.createRadialGradient(256, 256, 20, 256, 256, 320);
  grad.addColorStop(0, '#ff007f');
  grad.addColorStop(0.4, '#7928ca');
  grad.addColorStop(0.8, '#00dfd8');
  grad.addColorStop(1, '#050510');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  // Geometric abstract shapes with artificial smooth glow
  ctx.strokeStyle = '#00ffff';
  ctx.lineWidth = 4;
  for (let i = 1; i <= 6; i++) {
    ctx.beginPath();
    ctx.arc(256, 256, i * 36, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Artificial periodic grid modulation (typical of diffusion latent decoder checkerboard)
  const imgData = ctx.getImageData(0, 0, 512, 512);
  const p = imgData.data;
  for (let y = 0; y < 512; y++) {
    for (let x = 0; x < 512; x++) {
      const idx = (y * 512 + x) * 4;
      // Stride-8 periodic checkerboard wave
      const wave = Math.sin((x * Math.PI) / 4) * Math.sin((y * Math.PI) / 4) * 16;
      p[idx] = Math.max(0, Math.min(255, p[idx] + wave));
      p[idx + 1] = Math.max(0, Math.min(255, p[idx + 1] + wave));
      p[idx + 2] = Math.max(0, Math.min(255, p[idx + 2] + wave));
    }
  }
  ctx.putImageData(imgData, 0, 0);

  const blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), 'image/png'));
  return new File([blob], 'midjourney_v6_neon_portrait.png', { type: 'image/png' });
}

/**
 * Creates a spliced composite image (a base image with an alien high-contrast object pasted in to create ELA variance spike)
 */
async function generateEditedComposite(): Promise<File> {
  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 400;
  const ctx = canvas.getContext('2d')!;

  // Smooth base background
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(0, 0, 600, 400);

  // Base texture
  ctx.fillStyle = '#334155';
  ctx.fillRect(40, 40, 520, 320);

  // High-compression localized spliced box (simulating pasted object from another JPEG)
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(200, 120, 200, 160);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText('SPLICE AREA', 220, 200);

  // Add random high-contrast noise only inside the splice area
  const imgData = ctx.getImageData(0, 0, 600, 400);
  const p = imgData.data;
  for (let y = 120; y < 280; y++) {
    for (let x = 200; x < 400; x++) {
      const idx = (y * 600 + x) * 4;
      const noise = (Math.random() - 0.5) * 40;
      p[idx] = Math.max(0, Math.min(255, p[idx] + noise));
      p[idx + 1] = Math.max(0, Math.min(255, p[idx + 1] + noise));
      p[idx + 2] = Math.max(0, Math.min(255, p[idx + 2] + noise));
    }
  }
  ctx.putImageData(imgData, 0, 0);

  const blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.88));
  return new File([blob], 'photoshop_spliced_composite.jpg', { type: 'image/jpeg' });
}

/**
 * Creates a lightly filtered photo with soft beauty smoothing
 */
async function generateTouchedUp(): Promise<File> {
  const canvas = document.createElement('canvas');
  canvas.width = 500;
  canvas.height = 500;
  const ctx = canvas.getContext('2d')!;

  // Warm portrait background
  const grad = ctx.createLinearGradient(0, 0, 500, 500);
  grad.addColorStop(0, '#fed7aa');
  grad.addColorStop(0.5, '#f472b6');
  grad.addColorStop(1, '#c084fc');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 500, 500);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.beginPath();
  ctx.arc(250, 220, 120, 0, Math.PI * 2);
  ctx.fill();

  // Subtle smoothing
  const blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.90));
  return new File([blob], 'insta_filtered_selfie.jpg', { type: 'image/jpeg' });
}

export const SAMPLE_IMAGES: SampleImageOption[] = [
  {
    id: 'sample-real',
    name: 'Genuine Camera Photo',
    category: 'genuine',
    kannadaHint: 'Fully Nija (ನೈಜ ಫೋಟೋ)',
    description: 'Natural optical sensor capture with rich sensor grain and 1/f frequency spectrum.',
    generate: generateRealPhoto,
  },
  {
    id: 'sample-ai',
    name: 'Midjourney AI Art',
    category: 'ai_generated',
    kannadaHint: 'Machine Maadidhu (ಎಐ ಸೃಷ್ಟಿ)',
    description: 'Synthetic diffusion artwork containing latent decoder grid harmonics and no camera metadata.',
    generate: generateAiArt,
  },
  {
    id: 'sample-edited',
    name: 'Spliced Composite Edit',
    category: 'edited',
    kannadaHint: 'Edit Maadidru (ತಿದ್ದಿದ ಚಿತ್ರ)',
    description: 'Photoshop spliced composite with localized ELA error level variance hotspots.',
    generate: generateEditedComposite,
  },
  {
    id: 'sample-touched',
    name: 'Touched Up Selfie',
    category: 'touched_up',
    kannadaHint: 'Thumba Filter (ಫಿಲ್ಟರ್ ಹಾಕಿದ್ದು)',
    description: 'Authentic base photo with post-processing filters and smoothing.',
    generate: generateTouchedUp,
  },
];
