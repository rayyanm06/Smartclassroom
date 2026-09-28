import React from 'react';
import { Info, Sparkles } from 'lucide-react';

export const PredictionsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="border-ink bg-white p-4 shadow-neo flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="neo-header-strip inline-block mb-2">MACHINE LEARNING · PROBABILISTIC OCCUPANCY</span>
          <h1 className="text-2xl font-bold font-heading uppercase tracking-tight">Occupancy Predictions</h1>
          <p className="text-sm text-neutral-600">LogisticRegression P(occupied) & Ridge regression people-count estimators (§15)</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="neo-btn px-3 py-1.5 text-xs bg-[#111111] text-white">
            <Sparkles size={14} /> RETRAIN MODEL
          </button>
        </div>
      </div>

      {/* Mandatory Transparent Synthetic Data Banner (§15) */}
      <div className="p-3 bg-[#F2C94C]/25 border-2 border-ink flex items-start gap-3">
        <Info className="text-amber-800 shrink-0 mt-0.5" size={18} />
        <div className="text-xs text-amber-950">
          <strong className="uppercase">Demonstration Notice:</strong> Model is trained on 28 days of data (85% synthetic generated history). Predictions are for demonstration purposes until campus live data accumulates.
        </div>
      </div>

      <div className="neo-card p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-ink pb-3 mb-4 gap-3">
          <h2 className="font-heading font-bold text-base uppercase">Projected Occupancy Heatmap (Room × Hour)</h2>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono">DATE:</span>
            <input type="date" defaultValue="2026-09-29" className="border-ink px-2 py-1 text-xs font-mono bg-[#F4F1EA]" />
          </div>
        </div>

        <div className="p-12 border-2 border-dashed border-neutral-300 text-center bg-neutral-50 font-mono text-xs text-neutral-600">
          Heatmap matrix rendering occupancy probability (0.0 to 1.0) and expected headcounts.
        </div>
      </div>
    </div>
  );
};
