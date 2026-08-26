import React, { useState } from 'react';
import { ImageAnalysisResult, VerdictBandId } from '../types';
import { ThumbnailCard } from './ThumbnailCard';
import { Plus, Trash2, Filter, Sparkles, SlidersHorizontal } from 'lucide-react';

interface ResultsGridProps {
  results: ImageAnalysisResult[];
  onSelectResult: (result: ImageAnalysisResult) => void;
  onDeleteResult: (id: string, e: React.MouseEvent) => void;
  onClearAll: () => void;
  onUploadMore: () => void;
}

export const ResultsGrid: React.FC<ResultsGridProps> = ({
  results,
  onSelectResult,
  onDeleteResult,
  onClearAll,
  onUploadMore,
}) => {
  const [filterBand, setFilterBand] = useState<string>('all');

  const filteredResults = results.filter((r) => {
    if (filterBand === 'all') return true;
    return r.verdict.band === filterBand;
  });

  const filterOptions = [
    { id: 'all', label: 'All Items', count: results.length },
    { id: 'genuine', label: 'Genuine (85+)', count: results.filter((r) => r.verdict.band === 'genuine').length },
    { id: 'touched_up', label: 'Touched Up (60-84)', count: results.filter((r) => r.verdict.band === 'touched_up').length },
    { id: 'edited', label: 'Edited (30-59)', count: results.filter((r) => r.verdict.band === 'edited').length },
    { id: 'ai_generated', label: 'AI Generated (0-29)', count: results.filter((r) => r.verdict.band === 'ai_generated').length },
  ];

  return (
    <div id="results-grid-view" className="space-y-5">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-neutral-800">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Analyzed Image Batch</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300">
              {results.length} {results.length === 1 ? 'image' : 'images'}
            </span>
          </h2>
          <p className="text-xs text-neutral-400">
            Click any thumbnail card below to inspect the full-size forensic details, ELA heatmap &amp; frequency spectrum.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            id="btn-upload-more"
            onClick={onUploadMore}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-semibold cursor-pointer transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add More Images</span>
          </button>

          <button
            type="button"
            id="btn-clear-all"
            onClick={onClearAll}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-red-400 border border-neutral-800 text-xs cursor-pointer transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Filter pills */}
      {results.length > 1 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <SlidersHorizontal className="w-3.5 h-3.5 text-neutral-400 mr-1 shrink-0" />
          {filterOptions.map((opt) => (
            <button
              key={opt.id}
              type="button"
              id={`filter-btn-${opt.id}`}
              onClick={() => setFilterBand(opt.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium shrink-0 transition-colors cursor-pointer flex items-center gap-1.5 ${
                filterBand === opt.id
                  ? 'bg-neutral-800 text-white border border-neutral-700'
                  : 'bg-neutral-900/60 text-neutral-400 hover:text-neutral-200 border border-neutral-800/80'
              }`}
            >
              <span>{opt.label}</span>
              <span className="text-[10px] font-mono opacity-70">({opt.count})</span>
            </button>
          ))}
        </div>
      )}

      {/* Grid of Results */}
      {filteredResults.length === 0 ? (
        <div className="p-12 text-center rounded-xl bg-neutral-900/40 border border-neutral-800 text-neutral-400 space-y-2">
          <p className="text-sm">No images match the selected filter category.</p>
          <button
            type="button"
            onClick={() => setFilterBand('all')}
            className="text-xs text-cyan-400 underline cursor-pointer"
          >
            Reset filter
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredResults.map((res) => (
            <ThumbnailCard
              key={res.id}
              result={res}
              onSelect={onSelectResult}
              onDelete={onDeleteResult}
            />
          ))}
        </div>
      )}
    </div>
  );
};
