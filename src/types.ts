export type VerdictBandId = 'genuine' | 'touched_up' | 'edited' | 'ai_generated' | 'inconclusive';

export interface VerdictInfo {
  band: VerdictBandId;
  kannadaLabel: string;
  englishTranslation: string;
  description: string;
  color: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  minScore: number;
  maxScore: number;
}

export interface SignalScore {
  name: string;
  weight: number; // e.g. 30 (c2pa), 35 (ensemble), 20 (ela), 10 (frequency), 5 (metadata)
  score: number; // 0 to 100 (100 = genuine/untouched, 0 = AI/manipulated)
  rawConfidence?: number;
  label: string;
  summary: string;
  details: string;
  metrics?: Record<string, any>;
}

export interface C2PAReport {
  score: number; // 0 to 100
  hasManifest: boolean;
  isValid: boolean;
  claimGenerator?: string;
  issuer?: string;
  actions?: string[];
  aiDisclosed?: boolean;
  detail: string;
  metrics?: Record<string, any>;
}

export interface ExifReport {
  score: number; // 0 to 100
  hasExif: boolean;
  cameraMake?: string;
  cameraModel?: string;
  lensModel?: string;
  software?: string;
  createDate?: string;
  modifyDate?: string;
  iso?: number;
  fNumber?: number;
  exposureTime?: string;
  focalLength?: string;
  gps?: {
    latitude?: number;
    longitude?: number;
  };
  detectedAiSoftware?: string;
  rawTagsCount: number;
  tags: Record<string, any>;
  integrityNotes: string[];
  socialCompressionSuspected?: boolean;
}

export interface ELAReport {
  score: number; // 0 to 100
  meanError: number;
  variance: number;
  hotspotCount: number;
  maxErrorBlockRatio: number;
  elaImageDataUrl: string;
  anomalyDetected?: boolean;
  notes: string[];
  metrics?: Record<string, any>;
}

export interface FFTReport {
  score: number; // 0 to 100
  peakCount: number;
  highFreqEnergyRatio: number;
  azimuthalSymmetry: number;
  anomalyRatio: number;
  fftImageDataUrl: string;
  radialFalloffFit?: number;
  notes: string[];
  metrics?: Record<string, any>;
}

export interface AIModelReport {
  score: number; // 0 to 100 (100 = human/real, 0 = AI generated)
  aiProbability: number; // 0.0 to 1.0
  realProbability: number; // 0.0 to 1.0
  modelName: string;
  executionBackend: 'PyTorch Server Ensemble' | 'WebGPU' | 'WASM' | 'Heuristic Fallback';
  topPrediction: string;
  notes: string[];
  perModel?: Record<string, number>;
  modelsEvaluated?: string[];
}

export interface ImageAnalysisResult {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  width: number;
  height: number;
  originalDataUrl: string;
  thumbnailDataUrl: string;
  timestamp: number;
  status: 'pending' | 'analyzing' | 'completed' | 'error';
  progress: number;
  currentStep?: string;
  errorMessage?: string;

  // Composite Score (0 - 100)
  nijaScore: number;
  verdict: VerdictInfo;
  caveats?: string[];

  // 5 Calibrated Scoring Signals
  signals: {
    c2pa: SignalScore;
    aiEnsemble: SignalScore;
    ela: SignalScore;
    frequency: SignalScore;
    metadata: SignalScore;
  };

  // Detailed Reports for Deep-Dive
  c2paReport?: C2PAReport;
  aiModelReport?: AIModelReport;
  elaReport?: ELAReport;
  fftReport?: FFTReport;
  exifReport?: ExifReport;

  // Execution engine source
  engine?: string;
}

export interface BackendAnalyzeResponse {
  results: Array<{
    filename: string;
    nija_score: number;
    verdict: string;
    kannada_verdict?: string;
    english_translation?: string;
    verdict_band?: VerdictBandId;
    verdict_description?: string;
    caveats?: string[];
    signals: {
      c2pa: {
        score: number;
        detail: string;
        has_manifest?: boolean;
        is_valid?: boolean;
        claim_generator?: string;
        ai_disclosed?: boolean;
        actions?: string[];
        metrics?: Record<string, any>;
      };
      ai_gen_ensemble: {
        score: number;
        detail: string;
        per_model?: Record<string, number>;
        models_evaluated?: string[];
        metrics?: Record<string, any>;
      };
      ela: {
        score: number;
        detail: string;
        mean_error?: number;
        variance?: number;
        anomaly_detected?: boolean;
        hotspots?: number;
        ela_image_base64?: string;
        metrics?: Record<string, any>;
      };
      frequency: {
        score: number;
        detail: string;
        radial_falloff_fit?: number;
        high_freq_anomaly_ratio?: number;
        grid_peaks_count?: number;
        fft_image_base64?: string;
        metrics?: Record<string, any>;
      };
      metadata: {
        score: number;
        detail: string;
        has_exif?: boolean;
        camera_make?: string;
        camera_model?: string;
        software?: string;
        detected_ai_software?: string;
        tags_count?: number;
        gps_present?: boolean;
        social_compression_suspected?: boolean;
        tags?: Record<string, any>;
      };
    };
    width?: number;
    height?: number;
    file_size_bytes?: number;
  }>;
  processed_count: number;
  engine?: string;
}
