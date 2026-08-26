import React, { useState, useRef, useEffect } from 'react';
import { ImageAnalysisResult } from '../types';
import { performELA } from '../lib/elaAnalysis';
import {
  Eye,
  Layers,
  Activity,
  Columns,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RefreshCw,
  Sliders,
  Download,
} from 'lucide-react';

interface ImageInspectorProps {
  imageResult: ImageAnalysisResult;
}

type ViewMode = 'original' | 'ela' | 'fft' | 'split';

export const ImageInspector: React.FC<ImageInspectorProps> = ({ imageResult }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('original');
  const [elaAmplification, setElaAmplification] = useState<number>(15);
  const [splitPosition, setSplitPosition] = useState<number>(50); // percentage 0-100
  const [customElaUrl, setCustomElaUrl] = useState<string | null>(null);
  const [isRegeneratingEla, setIsRegeneratingEla] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isDraggingSplit, setIsDraggingSplit] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Update ELA when amplification slider changes
  const handleAmplificationChange = async (newAmp: number) => {
    setElaAmplification(newAmp);
    setIsRegeneratingEla(true);
    try {
      const updatedEla = await performELA(imageResult.originalDataUrl, newAmp);
      setCustomElaUrl(updatedEla.elaImageDataUrl);
    } catch (err) {
      console.warn('Failed to regenerate ELA:', err);
    } finally {
      setIsRegeneratingEla(false);
    }
  };

  const activeElaUrl = customElaUrl || imageResult.elaReport?.elaImageDataUrl || imageResult.originalDataUrl;
  const activeFftUrl = imageResult.fftReport?.fftImageDataUrl || imageResult.originalDataUrl;

  // Dragging logic for split view
  const handleMouseDown = () => setIsDraggingSplit(true);
  const handleMouseUp = () => setIsDraggingSplit(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement> | MouseEvent) => {
    if (!isDraggingSplit || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    setSplitPosition((x / rect.width) * 100);
  };

  useEffect(() => {
    const onGlobalMouseUp = () => setIsDraggingSplit(false);
    const onGlobalMouseMove = (e: MouseEvent) => {
      if (isDraggingSplit) {
        handleMouseMove(e);
      }
    };
    window.addEventListener('mouseup', onGlobalMouseUp);
    window.addEventListener('mousemove', onGlobalMouseMove);
    return () => {
      window.removeEventListener('mouseup', onGlobalMouseUp);
      window.removeEventListener('mousemove', onGlobalMouseMove);
    };
  }, [isDraggingSplit]);

  const downloadCurrentView = () => {
    let targetUrl = imageResult.originalDataUrl;
    let suffix = 'original';
    if (viewMode === 'ela') {
      targetUrl = activeElaUrl;
      suffix = 'ela_heatmap';
    } else if (viewMode === 'fft') {
      targetUrl = activeFftUrl;
      suffix = 'fft_spectrum';
    }

    const a = document.createElement('a');
    a.href = targetUrl;
    a.download = `${imageResult.fileName.replace(/\.[^/.]+$/, '')}_${suffix}.png`;
    a.click();
  };

  return (
    <div id="image-inspector-root" className="flex flex-col h-full rounded-xl bg-neutral-900/80 border border-neutral-800 overflow-hidden">
      {/* Top toolbar */}
      <div className="p-3 border-b border-neutral-800 flex flex-wrap items-center justify-between gap-2 bg-neutral-950/60">
        {/* Mode Selector */}
        <div className="flex items-center gap-1 bg-neutral-900 p-1 rounded-lg border border-neutral-800">
          <button
            type="button"
            id="btn-inspect-original"
            onClick={() => setViewMode('original')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              viewMode === 'original'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Original</span>
          </button>

          <button
            type="button"
            id="btn-inspect-ela"
            onClick={() => setViewMode('ela')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              viewMode === 'ela'
                ? 'bg-neutral-800 text-cyan-400 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>ELA Heatmap</span>
          </button>

          <button
            type="button"
            id="btn-inspect-fft"
            onClick={() => setViewMode('fft')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              viewMode === 'fft'
                ? 'bg-neutral-800 text-amber-400 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>2D FFT Spectrum</span>
          </button>

          <button
            type="button"
            id="btn-inspect-split"
            onClick={() => setViewMode('split')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              viewMode === 'split'
                ? 'bg-neutral-800 text-emerald-400 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            <span>Split Slider</span>
          </button>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1 text-neutral-400">
          <button
            type="button"
            title="Zoom Out"
            onClick={() => setZoomLevel((z) => Math.max(0.5, z - 0.25))}
            className="p-1.5 rounded-md hover:bg-neutral-800 hover:text-neutral-200 cursor-pointer"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono px-1">{Math.round(zoomLevel * 100)}%</span>
          <button
            type="button"
            title="Zoom In"
            onClick={() => setZoomLevel((z) => Math.min(3, z + 0.25))}
            className="p-1.5 rounded-md hover:bg-neutral-800 hover:text-neutral-200 cursor-pointer"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Reset Zoom"
            onClick={() => setZoomLevel(1)}
            className="p-1.5 rounded-md hover:bg-neutral-800 hover:text-neutral-200 cursor-pointer"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Download Inspection Image"
            onClick={downloadCurrentView}
            className="p-1.5 rounded-md hover:bg-neutral-800 hover:text-cyan-400 cursor-pointer ml-1"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Sub-controls (when ELA is selected) */}
      {viewMode === 'ela' && (
        <div className="px-4 py-2 bg-neutral-950/40 border-b border-neutral-800 flex items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2 flex-1 max-w-xs">
            <Sliders className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
            <span className="text-neutral-300 shrink-0">Amplification:</span>
            <input
              type="range"
              min="5"
              max="35"
              step="5"
              value={elaAmplification}
              onChange={(e) => handleAmplificationChange(Number(e.target.value))}
              className="w-full accent-cyan-500 cursor-pointer"
            />
            <span className="font-mono text-cyan-400 shrink-0">{elaAmplification}x</span>
          </div>

          <div className="flex items-center gap-2 text-neutral-400 text-[11px]">
            {isRegeneratingEla ? (
              <span className="flex items-center gap-1 text-cyan-400">
                <RefreshCw className="w-3 h-3 animate-spin" /> Recomputing ELA...
              </span>
            ) : (
              <span>Bright patches = Spliced / high compression error discrepancy</span>
            )}
          </div>
        </div>
      )}

      {viewMode === 'fft' && (
        <div className="px-4 py-2 bg-neutral-950/40 border-b border-neutral-800 text-xs text-neutral-400 flex items-center justify-between">
          <span>Center = Low frequencies (broad shapes). Outer regions = Fine textures &amp; periodic grid artifacts.</span>
          <span className="font-mono text-[11px] text-amber-400">256x256 Log Power Spectrum</span>
        </div>
      )}

      {/* Main Image Inspection Canvas / Area */}
      <div
        ref={containerRef}
        id="image-stage-viewport"
        className="relative flex-1 min-h-[380px] sm:min-h-[460px] bg-[#070a0f] flex items-center justify-center p-4 overflow-hidden select-none"
        onMouseMove={handleMouseMove}
      >
        <div
          className="relative transition-transform duration-100 flex items-center justify-center max-w-full max-h-full"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          {viewMode === 'original' && (
            <img
              src={imageResult.originalDataUrl}
              alt={imageResult.fileName}
              className="max-h-[500px] w-auto max-w-full object-contain rounded shadow-lg border border-neutral-800"
            />
          )}

          {viewMode === 'ela' && (
            <div className="relative">
              <img
                src={activeElaUrl}
                alt="ELA Heatmap"
                className="max-h-[500px] w-auto max-w-full object-contain rounded shadow-lg border border-cyan-900/50"
              />
              <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/80 text-[10px] font-mono text-cyan-300 border border-cyan-500/30">
                ELA Error Map ({elaAmplification}x Amplified)
              </span>
            </div>
          )}

          {viewMode === 'fft' && (
            <div className="relative flex flex-col items-center">
              <img
                src={activeFftUrl}
                alt="2D FFT Spectrum"
                className="w-72 h-72 sm:w-84 sm:h-84 object-contain rounded shadow-lg border border-amber-900/50"
              />
              <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/80 text-[10px] font-mono text-amber-300 border border-amber-500/30">
                2D FFT Power Spectrum (Hanning Centered)
              </span>
            </div>
          )}

          {viewMode === 'split' && (
            <div className="relative max-h-[500px] overflow-hidden rounded border border-neutral-800 shadow-lg">
              {/* Underlying ELA image */}
              <img
                src={activeElaUrl}
                alt="ELA"
                className="max-h-[500px] w-auto max-w-full object-contain block"
              />

              {/* Clipped Original image on top */}
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${splitPosition}%` }}
              >
                <img
                  src={imageResult.originalDataUrl}
                  alt="Original"
                  className="max-h-[500px] w-auto max-w-none object-contain block"
                  style={{
                    width: containerRef.current ? `${containerRef.current.clientWidth}px` : 'auto',
                  }}
                />
              </div>

              {/* Draggable Divider line */}
              <div
                className="absolute top-0 bottom-0 w-1 bg-cyan-400 cursor-ew-resize shadow-md"
                style={{ left: `${splitPosition}%` }}
                onMouseDown={handleMouseDown}
              >
                <div className="absolute top-1/2 -translate-y-1/2 -left-3 w-7 h-7 rounded-full bg-cyan-500 border-2 border-white flex items-center justify-center text-[10px] text-black font-bold shadow-lg">
                  ↔
                </div>
              </div>

              {/* Labels */}
              <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/80 text-[10px] font-mono text-white">
                Original
              </span>
              <span className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/80 text-[10px] font-mono text-cyan-300">
                ELA Heatmap
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Image metadata footer bar */}
      <div className="p-3 border-t border-neutral-800 bg-neutral-950/80 flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-400 font-mono">
        <span className="truncate max-w-xs">{imageResult.fileName}</span>
        <div className="flex items-center gap-3 shrink-0">
          <span>{imageResult.width} × {imageResult.height} px</span>
          <span>{Math.round(imageResult.fileSize / 1024)} KB</span>
          <span className="uppercase text-neutral-500">{imageResult.mimeType.split('/')[1]}</span>
        </div>
      </div>
    </div>
  );
};
