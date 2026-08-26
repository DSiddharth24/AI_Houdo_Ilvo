import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, Image as ImageIcon, ShieldCheck, Sparkles, AlertCircle, FileUp } from 'lucide-react';
import { SAMPLE_IMAGES, SampleImageOption } from '../lib/sampleImages';

interface DropZoneProps {
  onFilesSelected: (files: File[]) => void;
  isAnalyzing: boolean;
  progressText?: string;
  progressPercent?: number;
}

export const DropZone: React.FC<DropZoneProps> = ({
  onFilesSelected,
  isAnalyzing,
  progressText,
  progressPercent = 0,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isGeneratingSample, setIsGeneratingSample] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Listen for clipboard paste events (Ctrl+V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (e.clipboardData && e.clipboardData.files.length > 0) {
        const files: File[] = [];
        for (let i = 0; i < e.clipboardData.files.length; i++) {
          const file = e.clipboardData.files[i];
          if (file.type.startsWith('image/')) {
            files.push(file);
          }
        }
        if (files.length > 0) {
          onFilesSelected(files);
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [onFilesSelected]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files: File[] = [];
      for (let i = 0; i < e.dataTransfer.files.length; i++) {
        const file = e.dataTransfer.files[i];
        if (file.type.startsWith('image/')) {
          files.push(file);
        }
      }
      if (files.length > 0) {
        onFilesSelected(files);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      onFilesSelected(files);
      // Reset input value so same file can be re-uploaded if needed
      e.target.value = '';
    }
  };

  const handleSampleClick = async (sample: SampleImageOption) => {
    try {
      setIsGeneratingSample(true);
      const file = await sample.generate();
      onFilesSelected([file]);
    } catch (err) {
      console.error('Failed to generate sample image:', err);
    } finally {
      setIsGeneratingSample(false);
    }
  };

  return (
    <div id="dropzone-container" className="space-y-6 max-w-4xl mx-auto">
      {/* Main Drag-Drop Target */}
      <div
        id="dropzone-area"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isAnalyzing && fileInputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center p-8 sm:p-12 rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer overflow-hidden ${
          isDragOver
            ? 'border-cyan-500 bg-cyan-950/20 shadow-xl shadow-cyan-950/50 scale-[1.008]'
            : 'border-neutral-800 hover:border-neutral-700 bg-neutral-900/60 hover:bg-neutral-900/90'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          className="hidden"
          disabled={isAnalyzing}
        />

        {/* Analyzing Overlay */}
        {isAnalyzing ? (
          <div className="flex flex-col items-center justify-center gap-4 py-4 w-full max-w-md text-center">
            <div className="relative w-14 h-14 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-cyan-500/20 border-t-cyan-400 animate-spin" />
              <Sparkles className="w-6 h-6 text-cyan-400 animate-pulse" />
            </div>

            <div className="space-y-1 w-full">
              <h3 className="text-base font-semibold text-white">Forensic Engine Analyzing...</h3>
              <p className="text-xs text-neutral-400 font-mono">{progressText || 'Running multi-signal inspection'}</p>
            </div>

            <div className="w-full bg-neutral-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-cyan-500 to-sky-400 h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.max(5, progressPercent)}%` }}
              />
            </div>
            <span className="text-[11px] font-mono text-cyan-300">{progressPercent}% complete</span>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-neutral-800/80 border border-neutral-700/80 flex items-center justify-center text-cyan-400 shadow-inner group-hover:scale-105 transition-transform">
              <UploadCloud className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white tracking-tight">
                Drop images here or <span className="text-cyan-400 underline underline-offset-4">browse files</span>
              </h3>
              <p className="text-xs text-neutral-400 max-w-sm">
                Supports single or multiple JPEG, PNG, WEBP, AVIF images. You can also paste directly (<kbd className="px-1.5 py-0.5 rounded bg-neutral-800 text-[10px] font-mono text-neutral-300">Ctrl+V</kbd>).
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-[11px] text-neutral-400">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                100% Client-Side Privacy
              </span>
              <span>•</span>
              <span>Zero Server Uploads</span>
              <span>•</span>
              <span>In-Browser Neural + ELA + 2D FFT</span>
            </div>
          </div>
        )}
      </div>

      {/* Quick Test Samples */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono uppercase tracking-wider text-neutral-400">
            Or test instantly with forensic sample templates
          </span>
          <span className="text-[11px] text-neutral-400 font-kannada">ಯಾವುದಾದರೂ ಮಾದರಿ ಕ್ಲಿಕ್ ಮಾಡಿ</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {SAMPLE_IMAGES.map((sample) => (
            <button
              key={sample.id}
              type="button"
              id={`btn-sample-${sample.id}`}
              disabled={isAnalyzing || isGeneratingSample}
              onClick={() => handleSampleClick(sample)}
              className="p-3 rounded-xl bg-neutral-900/80 border border-neutral-800 hover:border-neutral-700 hover:bg-neutral-800/80 transition-all text-left space-y-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-200 group-hover:text-cyan-400 transition-colors">
                  {sample.name}
                </span>
                <FileUp className="w-3.5 h-3.5 text-neutral-400 group-hover:text-cyan-400 transition-colors" />
              </div>
              <div className="text-[11px] font-kannada text-neutral-400">{sample.kannadaHint}</div>
              <p className="text-[11px] text-neutral-400 line-clamp-2 leading-relaxed">
                {sample.description}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
