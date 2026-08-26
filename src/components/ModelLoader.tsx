import React from 'react';
import { Cpu, ShieldCheck, Server, Sparkles } from 'lucide-react';

export const ModelLoader: React.FC = () => {
  return (
    <div
      id="engine-status-pill"
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-900/90 border border-neutral-800 text-[11px] text-neutral-400 font-mono shadow-sm"
    >
      <div className="flex items-center gap-1.5 text-cyan-400">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
        </span>
        <span className="font-semibold text-neutral-200">5-Signal Engine</span>
      </div>

      <span>•</span>

      <span className="flex items-center gap-1 text-neutral-300">
        <Cpu className="w-3.5 h-3.5 text-cyan-400" />
        <span>Full-Stack Active</span>
      </span>

      <span className="hidden sm:inline">•</span>

      <span className="hidden sm:flex items-center gap-1 text-indigo-300">
        <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
        <span>C2PA + ELA + FFT</span>
      </span>
    </div>
  );
};
