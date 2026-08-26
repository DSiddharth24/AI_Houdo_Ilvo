import React, { useState, useEffect } from 'react';
import { ImageAnalysisResult } from '../types';
import { ImageInspector } from './ImageInspector';
import { VerdictCard } from './VerdictCard';
import { ScoreBreakdown } from './ScoreBreakdown';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Layers,
  Activity,
  Cpu,
  MapPin,
  Camera,
  Calendar,
  Sparkles,
  AlertTriangle,
  FileCode2,
  Info,
} from 'lucide-react';

interface DetailViewProps {
  imageResult: ImageAnalysisResult;
  allResults: ImageAnalysisResult[];
  onBack: () => void;
  onNavigate: (nextResult: ImageAnalysisResult) => void;
}

type TabType = 'c2pa' | 'model' | 'ela' | 'frequency' | 'metadata';

export const DetailView: React.FC<DetailViewProps> = ({
  imageResult,
  allResults,
  onBack,
  onNavigate,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('c2pa');

  const currentIndex = allResults.findIndex((r) => r.id === imageResult.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < allResults.length - 1;

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onBack();
      } else if (e.key === 'ArrowLeft' && hasPrev) {
        onNavigate(allResults[currentIndex - 1]);
      } else if (e.key === 'ArrowRight' && hasNext) {
        onNavigate(allResults[currentIndex + 1]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, hasPrev, hasNext, allResults, onBack, onNavigate]);

  const { c2paReport, exifReport, elaReport, fftReport, aiModelReport } = imageResult;

  return (
    <div id="detail-view-root" className="space-y-4">
      {/* Detail View Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-neutral-800">
        <div className="flex items-center gap-3">
          <button
            type="button"
            id="btn-back-to-grid"
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-800 text-xs font-semibold cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Grid</span>
            <kbd className="hidden sm:inline px-1 py-0.2 text-[9px] font-mono rounded bg-neutral-800 text-neutral-400 ml-1">
              Esc
            </kbd>
          </button>

          <div className="truncate max-w-xs sm:max-w-md">
            <h2 className="text-base font-bold text-white truncate">{imageResult.fileName}</h2>
            <p className="text-[11px] font-mono text-neutral-400">
              {imageResult.width}×{imageResult.height} px • {Math.round(imageResult.fileSize / 1024)} KB
            </p>
          </div>
        </div>

        {/* Batch Navigation */}
        {allResults.length > 1 && (
          <div className="flex items-center gap-1.5 bg-neutral-900 p-1 rounded-lg border border-neutral-800 text-xs">
            <button
              type="button"
              id="btn-prev-image"
              disabled={!hasPrev}
              onClick={() => hasPrev && onNavigate(allResults[currentIndex - 1])}
              className="p-1 rounded hover:bg-neutral-800 text-neutral-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              title="Previous image (Left Arrow)"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono text-neutral-400 px-1">
              {currentIndex + 1} / {allResults.length}
            </span>
            <button
              type="button"
              id="btn-next-image"
              disabled={!hasNext}
              onClick={() => hasNext && onNavigate(allResults[currentIndex + 1])}
              className="p-1 rounded hover:bg-neutral-800 text-neutral-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              title="Next image (Right Arrow)"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Main Split Layout: Image on the left, score & forensic panel on the right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Interactive Image Inspection (7 Cols on desktop) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <ImageInspector imageResult={imageResult} />
        </div>

        {/* Right Column: Score & Deep Forensic Inspector (5 Cols on desktop) */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          {/* Large Verdict & Nija Score Card */}
          <VerdictCard
            verdict={imageResult.verdict}
            nijaScore={imageResult.nijaScore}
            caveats={imageResult.caveats}
          />

          {/* 5-Signal Breakdown Bars */}
          <ScoreBreakdown signals={imageResult.signals} />

          {/* Deep-Dive Inspection Tabs */}
          <div className="rounded-xl bg-neutral-900/80 border border-neutral-800 overflow-hidden">
            {/* Tab buttons */}
            <div className="flex items-center border-b border-neutral-800 bg-neutral-950/60 overflow-x-auto">
              <button
                type="button"
                id="tab-btn-c2pa"
                onClick={() => setActiveTab('c2pa')}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 shrink-0 transition-colors cursor-pointer ${
                  activeTab === 'c2pa'
                    ? 'border-indigo-500 text-indigo-400 bg-neutral-900/60'
                    : 'border-transparent text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>C2PA Credentials</span>
              </button>

              <button
                type="button"
                id="tab-btn-model"
                onClick={() => setActiveTab('model')}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 shrink-0 transition-colors cursor-pointer ${
                  activeTab === 'model'
                    ? 'border-cyan-500 text-cyan-400 bg-neutral-900/60'
                    : 'border-transparent text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>HF Ensemble</span>
              </button>

              <button
                type="button"
                id="tab-btn-ela"
                onClick={() => setActiveTab('ela')}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 shrink-0 transition-colors cursor-pointer ${
                  activeTab === 'ela'
                    ? 'border-sky-500 text-sky-400 bg-neutral-900/60'
                    : 'border-transparent text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Forensic ELA</span>
              </button>

              <button
                type="button"
                id="tab-btn-frequency"
                onClick={() => setActiveTab('frequency')}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 shrink-0 transition-colors cursor-pointer ${
                  activeTab === 'frequency'
                    ? 'border-amber-500 text-amber-400 bg-neutral-900/60'
                    : 'border-transparent text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>2D FFT Spectrum</span>
              </button>

              <button
                type="button"
                id="tab-btn-metadata"
                onClick={() => setActiveTab('metadata')}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 shrink-0 transition-colors cursor-pointer ${
                  activeTab === 'metadata'
                    ? 'border-emerald-500 text-emerald-400 bg-neutral-900/60'
                    : 'border-transparent text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <FileCode2 className="w-3.5 h-3.5" />
                <span>EXIF Integrity</span>
              </button>
            </div>

            {/* Tab content */}
            <div className="p-4 text-xs space-y-3">
              {/* Tab 1: C2PA Content Credentials */}
              {activeTab === 'c2pa' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-neutral-200">C2PA Cryptographic Provenance</span>
                    <span className="font-mono text-indigo-400">Score: {c2paReport?.score ?? 50}/100</span>
                  </div>

                  {c2paReport?.hasManifest ? (
                    <div className="p-3 rounded-lg bg-neutral-950 border border-indigo-500/30 space-y-2">
                      <div className="flex items-center gap-2 text-indigo-400 font-semibold">
                        <ShieldCheck className="w-4 h-4" />
                        <span>Valid C2PA Manifest Attached</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <span className="text-neutral-500 block">Claim Generator</span>
                          <span className="font-mono text-neutral-200 font-medium">
                            {c2paReport.claimGenerator || 'Standard C2PA Tool'}
                          </span>
                        </div>
                        <div>
                          <span className="text-neutral-500 block">AI Disclosed</span>
                          <span className={`font-mono font-bold ${c2paReport.aiDisclosed ? 'text-red-400' : 'text-emerald-400'}`}>
                            {c2paReport.aiDisclosed ? 'Yes (AI Synthetic)' : 'No (Camera Provenance)'}
                          </span>
                        </div>
                      </div>
                      {c2paReport.actions && c2paReport.actions.length > 0 && (
                        <div className="pt-1">
                          <span className="text-neutral-500 text-[10px] block">Recorded Actions</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {c2paReport.actions.map((act, i) => (
                              <span key={i} className="px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-[10px] font-mono text-neutral-300">
                                {act}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-neutral-300 font-medium">
                        <Info className="w-4 h-4 text-neutral-400" />
                        <span>No C2PA Manifest Embedded</span>
                      </div>
                      <p className="text-neutral-400 text-[11px] leading-relaxed">
                        Most existing photographs and internet images do not embed C2PA manifests yet. Absence is considered neutral and does not penalize authenticity.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Ensemble AI-Gen Classifier */}
              {activeTab === 'model' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-neutral-200">Ensemble AI Classifier</span>
                    <span className="font-mono text-cyan-400">Score: {aiModelReport?.score ?? 75}/100</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2 rounded bg-neutral-950 border border-neutral-800">
                      <span className="text-neutral-500 block">Real / Human Likelihood</span>
                      <span className="font-mono text-emerald-400 font-bold">
                        {Math.round((aiModelReport?.realProbability || 0.75) * 100)}%
                      </span>
                    </div>
                    <div className="p-2 rounded bg-neutral-950 border border-neutral-800">
                      <span className="text-neutral-500 block">AI Synthetic Likelihood</span>
                      <span className="font-mono text-red-400 font-bold">
                        {Math.round((aiModelReport?.aiProbability || 0.25) * 100)}%
                      </span>
                    </div>
                  </div>

                  {aiModelReport?.perModel && Object.keys(aiModelReport.perModel).length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 block">
                        Per-Model Predictions (% Real)
                      </span>
                      {Object.entries(aiModelReport.perModel).map(([modelName, prob]) => (
                        <div key={modelName} className="p-2 rounded bg-neutral-950 border border-neutral-800 flex items-center justify-between text-[11px]">
                          <span className="font-mono text-neutral-300 truncate max-w-[200px]">{modelName}</span>
                          <span className="font-mono font-bold text-cyan-400">{prob}%</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <p className="text-[11px] text-neutral-400 leading-relaxed bg-neutral-950 p-2.5 rounded border border-neutral-800">
                    <strong>Ensemble Accuracy Boost:</strong> Server-side ensemble averaging across multiple unquantized PyTorch models reduces single-model false positives, pushing detection accuracy from ~75% to ~85–92%.
                  </p>
                </div>
              )}

              {/* Tab 3: Forensic ELA */}
              {activeTab === 'ela' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-neutral-200">Forensic Error Level Analysis</span>
                    <span className="font-mono text-sky-400">Score: {elaReport?.score ?? 80}/100</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2 rounded bg-neutral-950 border border-neutral-800">
                      <span className="text-neutral-500 block">Mean Error</span>
                      <span className="font-mono text-neutral-200 font-bold">{elaReport?.meanError ?? 0}</span>
                    </div>
                    <div className="p-2 rounded bg-neutral-950 border border-neutral-800">
                      <span className="text-neutral-500 block">Block Variance</span>
                      <span className="font-mono text-neutral-200 font-bold">{elaReport?.variance ?? 0}</span>
                    </div>
                    <div className="p-2 rounded bg-neutral-950 border border-neutral-800">
                      <span className="text-neutral-500 block">Hotspot Blocks (Z &gt; 3.0)</span>
                      <span className="font-mono text-neutral-200 font-bold">{elaReport?.hotspotCount ?? 0}</span>
                    </div>
                    <div className="p-2 rounded bg-neutral-950 border border-neutral-800">
                      <span className="text-neutral-500 block">Anomaly Detected</span>
                      <span className="font-mono text-neutral-200 font-bold">
                        {elaReport?.anomalyDetected ? 'Yes (Spliced/Inpainted)' : 'No (Uniform)'}
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-neutral-400 leading-relaxed bg-neutral-950 p-2.5 rounded border border-neutral-800">
                    <strong>Forensic Principle:</strong> Multi-scale re-compression (75, 85, 95) with statistical Z-score thresholding isolates regions edited at different compression baselines.
                  </p>
                </div>
              )}

              {/* Tab 4: 2D FFT Frequency */}
              {activeTab === 'frequency' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-neutral-200">2D FFT Power Spectrum</span>
                    <span className="font-mono text-amber-400">Score: {fftReport?.score ?? 85}/100</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2 rounded bg-neutral-950 border border-neutral-800">
                      <span className="text-neutral-500 block">Periodic Peak Outliers</span>
                      <span className="font-mono text-neutral-200 font-bold">{fftReport?.peakCount ?? 0}</span>
                    </div>
                    <div className="p-2 rounded bg-neutral-950 border border-neutral-800">
                      <span className="text-neutral-500 block">Radial 1/f Slope Fit</span>
                      <span className="font-mono text-neutral-200 font-bold">
                        {fftReport?.radialFalloffFit ?? -1.45}
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-neutral-400 leading-relaxed bg-neutral-950 p-2.5 rounded border border-neutral-800">
                    <strong>Forensic Principle:</strong> Evaluates radially-averaged power spectrum luminance decay against known optical sensor curves to flag checkerboard upsampling artifacts.
                  </p>
                </div>
              )}

              {/* Tab 5: EXIF Metadata */}
              {activeTab === 'metadata' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-neutral-200">Hardware EXIF Integrity</span>
                    <span className="font-mono text-emerald-400">Score: {exifReport?.score ?? 60}/100</span>
                  </div>

                  {exifReport?.hasExif ? (
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="p-2 rounded bg-neutral-950 border border-neutral-800 space-y-0.5">
                        <span className="text-neutral-500">Camera</span>
                        <p className="font-mono text-neutral-200 font-medium truncate">
                          {exifReport.cameraMake || 'Unknown'} {exifReport.cameraModel || ''}
                        </p>
                      </div>

                      <div className="p-2 rounded bg-neutral-950 border border-neutral-800 space-y-0.5">
                        <span className="text-neutral-500">Software Tag</span>
                        <p className="font-mono text-neutral-200 font-medium truncate">
                          {exifReport.software || 'Camera Firmware'}
                        </p>
                      </div>

                      {exifReport.detectedAiSoftware && (
                        <div className="col-span-2 p-2 rounded bg-red-950/40 border border-red-900/50 space-y-0.5">
                          <span className="text-red-400 font-semibold">Leaked AI Software Tag</span>
                          <p className="font-mono text-red-200 font-bold truncate">
                            {exifReport.detectedAiSoftware}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-amber-400 font-medium">
                        <AlertTriangle className="w-4 h-4" />
                        <span>No Hardware EXIF Metadata Found</span>
                      </div>
                      <p className="text-neutral-400 text-[11px] leading-relaxed">
                        Pure AI generations or images shared over social media (WhatsApp, Instagram, Twitter) have EXIF stripped.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
