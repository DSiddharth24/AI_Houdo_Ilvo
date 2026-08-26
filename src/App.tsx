import React, { useState } from 'react';
import { ImageAnalysisResult } from './types';
import { analyzeImageWithBackend } from './lib/analyzer';
import { DropZone } from './components/DropZone';
import { ResultsGrid } from './components/ResultsGrid';
import { DetailView } from './components/DetailView';
import { ModelLoader } from './components/ModelLoader';
import {
  Shield,
  Sparkles,
  ShieldCheck,
  HelpCircle,
  Layers,
  Activity,
  FileCode2,
  Cpu,
} from 'lucide-react';

export default function App() {
  const [results, setResults] = useState<ImageAnalysisResult[]>([]);
  const [selectedResultId, setSelectedResultId] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [progressText, setProgressText] = useState<string>('');
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [showHowItWorksModal, setShowHowItWorksModal] = useState<boolean>(false);

  // Handle uploaded files
  const handleFilesSelected = async (files: File[]) => {
    if (files.length === 0) return;

    setIsAnalyzing(true);
    const newResults: ImageAnalysisResult[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const prefix = files.length > 1 ? `[${i + 1}/${files.length}] ` : '';

      try {
        const result = await analyzeImageWithBackend(file, file.name, (step, pct) => {
          setProgressText(`${prefix}${file.name}: ${step}`);
          const overallPct = Math.round(((i + pct / 100) / files.length) * 100);
          setProgressPercent(overallPct);
        });
        newResults.push(result);
      } catch (err) {
        console.error(`Failed to analyze ${file.name}:`, err);
      }
    }

    setResults((prev) => [...newResults, ...prev]);
    setIsAnalyzing(false);
    setProgressText('');
    setProgressPercent(0);

    // If single image was uploaded and no detail view active, auto-open it
    if (newResults.length === 1 && !selectedResultId) {
      setSelectedResultId(newResults[0].id);
    }
  };

  const handleSelectResult = (result: ImageAnalysisResult) => {
    setSelectedResultId(result.id);
  };

  const handleDeleteResult = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setResults((prev) => prev.filter((r) => r.id !== id));
    if (selectedResultId === id) {
      setSelectedResultId(null);
    }
  };

  const handleClearAll = () => {
    setResults([]);
    setSelectedResultId(null);
  };

  const activeResult = results.find((r) => r.id === selectedResultId) || null;

  return (
    <div className="min-h-screen flex flex-col bg-[#090d16] text-[#e6edf3]">
      {/* Header Bar */}
      <header className="border-b border-neutral-800/80 bg-[#0d111c]/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
          <div
            className="flex items-center gap-3 cursor-pointer select-none"
            onClick={() => setSelectedResultId(null)}
          >
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-white font-display">
                  AI Houdo Ilvo
                </h1>
                <span className="font-kannada text-xs sm:text-sm font-semibold text-cyan-400">
                  (ಎಐ ಹೌದೋ ಇಲ್ವೋ)
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 hidden sm:block">
                "Is it AI or not?" • Calibrated 5-Signal Forensic Verification Engine
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ModelLoader />
            <button
              type="button"
              id="btn-how-it-works"
              onClick={() => setShowHowItWorksModal(true)}
              className="p-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 border border-neutral-800 transition-colors cursor-pointer text-xs flex items-center gap-1"
              title="Forensic Methodology"
            >
              <HelpCircle className="w-4 h-4" />
              <span className="hidden sm:inline">How It Works</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {/* View 2: Detail View (when an image is selected) */}
        {activeResult ? (
          <DetailView
            imageResult={activeResult}
            allResults={results}
            onBack={() => setSelectedResultId(null)}
            onNavigate={(next) => setSelectedResultId(next.id)}
          />
        ) : results.length > 0 ? (
          /* View 1: Results Grid (default landing after upload) */
          <div className="space-y-8">
            <ResultsGrid
              results={results}
              onSelectResult={handleSelectResult}
              onDeleteResult={handleDeleteResult}
              onClearAll={handleClearAll}
              onUploadMore={() => {
                const el = document.getElementById('grid-dropzone-section');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
            />

            {/* Quick DropZone below grid */}
            <div id="grid-dropzone-section" className="pt-6 border-t border-neutral-800/80">
              <h3 className="text-xs font-mono uppercase tracking-wider text-neutral-400 mb-3">
                Upload Additional Images
              </h3>
              <DropZone
                onFilesSelected={handleFilesSelected}
                isAnalyzing={isAnalyzing}
                progressText={progressText}
                progressPercent={progressPercent}
              />
            </div>
          </div>
        ) : (
          /* Initial Empty State / Upload Landing */
          <div className="space-y-8 py-4 sm:py-8">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-semibold mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>v2 High-Accuracy Forensic Engine • Stateless In-Memory Processing</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                Detect AI Synthesis, Tampering &amp; Camera Authenticity
              </h2>
              <p className="text-sm text-neutral-400 leading-relaxed">
                Evaluates images using a weighted 5-signal composite <strong className="text-neutral-200">Nija Score</strong> (0–100) combining C2PA Content Credentials, PyTorch multi-model ensembles, Error Level Analysis (ELA), 2D FFT frequency harmonics, and EXIF metadata.
              </p>
            </div>

            <DropZone
              onFilesSelected={handleFilesSelected}
              isAnalyzing={isAnalyzing}
              progressText={progressText}
              progressPercent={progressPercent}
            />

            {/* 5 Signals High-Level Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 max-w-5xl mx-auto pt-4">
              <div className="p-3 rounded-xl bg-neutral-900/50 border border-neutral-800 space-y-1.5">
                <div className="flex items-center gap-1.5 text-indigo-400">
                  <ShieldCheck className="w-4 h-4" />
                  <span className="font-semibold text-xs text-white">C2PA (30%)</span>
                </div>
                <p className="text-[11px] text-neutral-400 leading-snug">
                  Cryptographically signed provenance tokens and AI disclosure tags.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-neutral-900/50 border border-neutral-800 space-y-1.5">
                <div className="flex items-center gap-1.5 text-cyan-400">
                  <Cpu className="w-4 h-4" />
                  <span className="font-semibold text-xs text-white">AI Ensemble (35%)</span>
                </div>
                <p className="text-[11px] text-neutral-400 leading-snug">
                  PyTorch ensemble averaging 3 Hugging Face deep neural classifiers.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-neutral-900/50 border border-neutral-800 space-y-1.5">
                <div className="flex items-center gap-1.5 text-sky-400">
                  <Layers className="w-4 h-4" />
                  <span className="font-semibold text-xs text-white">ELA Variance (20%)</span>
                </div>
                <p className="text-[11px] text-neutral-400 leading-snug">
                  Multi-scale JPEG re-saving with block Z-score thresholding for splicing.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-neutral-900/50 border border-neutral-800 space-y-1.5">
                <div className="flex items-center gap-1.5 text-amber-400">
                  <Activity className="w-4 h-4" />
                  <span className="font-semibold text-xs text-white">2D FFT (10%)</span>
                </div>
                <p className="text-[11px] text-neutral-400 leading-snug">
                  Radially-averaged power spectrum identifying upsampler grid artifacts.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-neutral-900/50 border border-neutral-800 space-y-1.5">
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <FileCode2 className="w-4 h-4" />
                  <span className="font-semibold text-xs text-white">Metadata (5%)</span>
                </div>
                <p className="text-[11px] text-neutral-400 leading-snug">
                  EXIF camera hardware parameters and AI-software string leaks.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-800/80 bg-[#070a10] py-4 text-center text-xs text-neutral-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="font-mono text-[11px]">
            AI Houdo Ilvo (ಎಐ ಹೌದೋ ಇಲ್ವೋ) • Forensic Verification Suite
          </span>
          <span className="text-neutral-400 text-[11px]">
            Stateless in-memory processing • Never persisted to disk
          </span>
        </div>
      </footer>

      {/* Methodology Modal */}
      {showHowItWorksModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-[#0f1422] border border-neutral-800 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-cyan-400" />
                <span>The Nija Score &amp; Forensic Methodology</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowHowItWorksModal(false)}
                className="text-neutral-400 hover:text-white text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-neutral-300 leading-relaxed">
              <p>
                <strong>Nija (ನೈಜ)</strong> is the Kannada word for <em>"real"</em> or <em>"true"</em>. Rather than relying on a single fallible classifier, <strong>AI Houdo Ilvo</strong> evaluates 5 weighted signals:
              </p>

              <div className="space-y-2 pt-1 font-mono text-[11px]">
                <div className="p-2.5 rounded bg-neutral-900 border border-neutral-800">
                  <span className="text-indigo-400 font-bold block mb-1">1. C2PA Content Credentials (Weight: 30%)</span>
                  <span className="text-neutral-400 font-sans">
                    Checks cryptographic provenance manifests (Adobe, OpenAI, Microsoft, Google). Direct AI disclosure triggers an immediate override.
                  </span>
                </div>

                <div className="p-2.5 rounded bg-neutral-900 border border-neutral-800">
                  <span className="text-cyan-400 font-bold block mb-1">2. Ensemble AI-Gen Classifier (Weight: 35%)</span>
                  <span className="text-neutral-400 font-sans">
                    Averages predictions from 3 deep PyTorch neural classifiers (sdxl-detector, AI-image-detector, ai-vs-human) to mitigate individual model bias.
                  </span>
                </div>

                <div className="p-2.5 rounded bg-neutral-900 border border-neutral-800">
                  <span className="text-sky-400 font-bold block mb-1">3. Error Level Analysis / ELA (Weight: 20%)</span>
                  <span className="text-neutral-400 font-sans">
                    Multi-quality JPEG re-saving (75, 85, 95) with statistical Z-score block variance thresholding to isolate localized tampering and spliced regions.
                  </span>
                </div>

                <div className="p-2.5 rounded bg-neutral-900 border border-neutral-800">
                  <span className="text-amber-400 font-bold block mb-1">4. 2D FFT Frequency Spectrum (Weight: 10%)</span>
                  <span className="text-neutral-400 font-sans">
                    Radial power spectrum analysis comparing high-frequency luminance decay with authentic optical 1/f sensor noise decay.
                  </span>
                </div>

                <div className="p-2.5 rounded bg-neutral-900 border border-neutral-800">
                  <span className="text-emerald-400 font-bold block mb-1">5. EXIF Metadata &amp; Software Tags (Weight: 5%)</span>
                  <span className="text-neutral-400 font-sans">
                    Binary header inspection for camera hardware parameters (ISO, exposure, lens) and AI generation software strings.
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-cyan-950/30 border border-cyan-900/50 text-[11px] text-cyan-200">
                <strong>Stateless Privacy Guarantee:</strong> Images are processed entirely in memory and are never persisted to disk or databases.
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowHowItWorksModal(false)}
                className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-xs cursor-pointer"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
