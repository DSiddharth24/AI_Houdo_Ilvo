import React from 'react';
import { ImageAnalysisResult } from '../types';
import { VerdictCard } from './VerdictCard';
import { Trash2, ShieldCheck, Cpu, Layers, Activity, FileCode2 } from 'lucide-react';

interface ThumbnailCardProps {
  result: ImageAnalysisResult;
  onSelect: (result: ImageAnalysisResult) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
}

export const ThumbnailCard: React.FC<ThumbnailCardProps> = ({ result, onSelect, onDelete }) => {
  const { nijaScore, verdict, signals, thumbnailDataUrl, fileName, fileSize, width, height } = result;

  const getScoreColorClass = (score: number) => {
    if (score >= 85) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    if (score >= 60) return 'text-sky-400 bg-sky-500/10 border-sky-500/30';
    if (score >= 30) return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    return 'text-red-400 bg-red-500/10 border-red-500/30';
  };

  return (
    <div
      id={`thumbnail-card-${result.id}`}
      onClick={() => onSelect(result)}
      className="group relative flex flex-col rounded-xl bg-neutral-900/90 border border-neutral-800 hover:border-neutral-700 hover:shadow-xl transition-all duration-200 overflow-hidden cursor-pointer"
    >
      {/* Image Thumbnail Header */}
      <div className="relative w-full h-44 bg-[#070a0f] overflow-hidden flex items-center justify-center">
        <img
          src={thumbnailDataUrl || result.originalDataUrl}
          alt={fileName}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* Gradient overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/90 via-neutral-950/20 to-transparent pointer-events-none" />

        {/* Nija Score Badge on top right */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1">
          <div
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border font-mono font-bold text-xs backdrop-blur-md ${getScoreColorClass(
              nijaScore
            )}`}
          >
            <span className="text-[10px] text-neutral-400 font-normal">NIJA</span>
            <span>{nijaScore}</span>
          </div>
        </div>

        {/* Delete button on top left */}
        <button
          type="button"
          onClick={(e) => onDelete(result.id, e)}
          title="Remove Image"
          className="absolute top-2.5 left-2.5 p-1.5 rounded-lg bg-black/60 hover:bg-red-500/20 text-neutral-400 hover:text-red-400 border border-neutral-800/80 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>

        {/* Image specs tag bottom left */}
        <div className="absolute bottom-2 left-2.5 text-[11px] font-mono text-neutral-400 truncate max-w-[80%]">
          {fileName}
        </div>
      </div>

      {/* Body content */}
      <div className="p-4 flex-1 flex flex-col justify-between gap-3">
        {/* Verdict Badge */}
        <div>
          <VerdictCard verdict={verdict} nijaScore={nijaScore} compact />
          <p className="text-xs text-neutral-400 mt-1.5 line-clamp-1">
            {verdict.englishTranslation}
          </p>
        </div>

        {/* Mini 5-signal breakdown */}
        <div className="space-y-1.5 pt-2 border-t border-neutral-800/80 text-[11px]">
          <div className="grid grid-cols-5 gap-1 text-center font-mono">
            <div className="p-1 rounded bg-neutral-950 border border-neutral-800" title="C2PA Provenance (30% wt)">
              <span className="text-[8px] text-indigo-400 block truncate">C2PA</span>
              <span className="font-bold text-neutral-200 text-[10px]">{signals.c2pa.score}</span>
            </div>
            <div className="p-1 rounded bg-neutral-950 border border-neutral-800" title="HF Ensemble AI-Gen (35% wt)">
              <span className="text-[8px] text-cyan-400 block truncate">AI-ENS</span>
              <span className="font-bold text-neutral-200 text-[10px]">{signals.aiEnsemble.score}</span>
            </div>
            <div className="p-1 rounded bg-neutral-950 border border-neutral-800" title="Forensic ELA (20% wt)">
              <span className="text-[8px] text-sky-400 block truncate">ELA</span>
              <span className="font-bold text-neutral-200 text-[10px]">{signals.ela.score}</span>
            </div>
            <div className="p-1 rounded bg-neutral-950 border border-neutral-800" title="2D FFT Spectrum (10% wt)">
              <span className="text-[8px] text-amber-400 block truncate">FFT</span>
              <span className="font-bold text-neutral-200 text-[10px]">{signals.frequency.score}</span>
            </div>
            <div className="p-1 rounded bg-neutral-950 border border-neutral-800" title="EXIF Metadata (5% wt)">
              <span className="text-[8px] text-emerald-400 block truncate">EXIF</span>
              <span className="font-bold text-neutral-200 text-[10px]">{signals.metadata.score}</span>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between pt-2 border-t border-neutral-800/80 text-[11px] text-neutral-400">
          <span>
            {width}×{height} px
          </span>
          <span>{Math.round(fileSize / 1024)} KB</span>
        </div>
      </div>
    </div>
  );
};
