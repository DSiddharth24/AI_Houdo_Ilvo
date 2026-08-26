import express, { Request, Response } from 'express';
import path from 'path';
import multer from 'multer';
import { createServer as createViteServer } from 'vite';
import { checkC2PA } from './server/c2pa';
import { performErrorLevelAnalysis } from './server/ela';
import { performFrequencyAnalysis } from './server/fft';
import { checkExifMetadata } from './server/exif';
import { predictAIEnsemble } from './server/aiClassifier';
import { calculateCompositeNijaScore } from './server/scoring';

// Configure in-memory multipart upload handling (Max 35MB per file)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 35 * 1024 * 1024,
    files: 10,
  },
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '40mb' }));
  app.use(express.urlencoded({ extended: true, limit: '40mb' }));

  // Health check endpoint
  app.get(['/health', '/api/health'], (req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      service: 'AI Houdo Ilvo Forensic Engine v2',
      engine: 'Stateless Node.js + Express Full-Stack Forensic Pipeline',
      signals: [
        'C2PA Content Credentials (30%)',
        'Ensemble AI Classifier (35%)',
        'Error Level Analysis (20%)',
        '2D FFT Power Spectrum (10%)',
        'EXIF Metadata Integrity (5%)',
      ],
    });
  });

  // Forensic Analysis Handler
  const handleAnalyze = async (req: Request, res: Response) => {
    try {
      const files: Express.Multer.File[] = [];

      // Accept files from multiple common field names (images, image, file, files)
      if (req.files) {
        if (Array.isArray(req.files)) {
          files.push(...req.files);
        } else {
          for (const key of Object.keys(req.files)) {
            const list = req.files[key];
            if (Array.isArray(list)) {
              files.push(...list);
            }
          }
        }
      } else if (req.file) {
        files.push(req.file);
      }

      if (files.length === 0) {
        return res.status(400).json({
          error: 'No image file uploaded. Provide images in multipart form-data under field name "images".',
        });
      }

      const results = [];

      for (const file of files) {
        const buffer = file.buffer;
        const filename = file.originalname || 'image.jpg';
        const mimeType = file.mimetype || 'image/jpeg';
        const fileSizeBytes = buffer.length;

        // Run 5 Calibrated Forensic Signals concurrently in-memory
        const [c2paResult, aiEnsembleResult, elaResult, freqResult, exifResult] = await Promise.all([
          Promise.resolve(checkC2PA(buffer, mimeType)),
          predictAIEnsemble(buffer, mimeType),
          Promise.resolve(performErrorLevelAnalysis(buffer)),
          Promise.resolve(performFrequencyAnalysis(buffer)),
          checkExifMetadata(buffer),
        ]);

        const signals = {
          c2pa: c2paResult,
          ai_gen_ensemble: aiEnsembleResult,
          ela: elaResult,
          frequency: freqResult,
          metadata: exifResult,
        };

        // Compute weighted composite score and verdict
        const { nijaScore, verdictInfo, caveats } = calculateCompositeNijaScore({
          c2paScore: c2paResult.score,
          aiEnsembleScore: aiEnsembleResult.score,
          elaScore: elaResult.score,
          frequencyScore: freqResult.score,
          metadataScore: exifResult.score,
          c2paAiDisclosed: c2paResult.ai_disclosed,
        });

        results.push({
          filename,
          nija_score: nijaScore,
          verdict: verdictInfo.verdict,
          kannada_verdict: verdictInfo.kannada,
          english_translation: verdictInfo.english,
          verdict_band: verdictInfo.band,
          verdict_description: verdictInfo.description,
          caveats,
          signals,
          file_size_bytes: fileSizeBytes,
        });
      }

      return res.json({
        results,
        processed_count: results.length,
        engine: 'Express Full-Stack Forensics Engine',
      });
    } catch (err: any) {
      console.error('Error during forensic analysis:', err);
      return res.status(500).json({
        error: 'Failed to process image forensics.',
        details: err?.message || String(err),
      });
    }
  };

  // Support both /analyze and /api/analyze with multiple field uploads
  const uploadFields = upload.fields([
    { name: 'images', maxCount: 10 },
    { name: 'image', maxCount: 10 },
    { name: 'file', maxCount: 10 },
    { name: 'files', maxCount: 10 },
  ]);

  app.post('/analyze', uploadFields, handleAnalyze);
  app.post('/api/analyze', uploadFields, handleAnalyze);

  // Vite middleware for development vs static build in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AI Houdo Ilvo Full-Stack Server running on port ${PORT}`);
  });
}

startServer();
