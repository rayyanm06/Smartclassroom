import React, { useState } from 'react';
import { Save } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [preset, setPreset] = useState<'demo' | 'production'>('demo');

  return (
    <div className="space-y-6">
      <div className="border-ink bg-white p-4 shadow-neo flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="neo-header-strip inline-block mb-2">SYSTEM PARAMETERS · THRESHOLD CONFIGURATION</span>
          <h1 className="text-2xl font-bold font-heading uppercase tracking-tight">System Settings</h1>
          <p className="text-sm text-neutral-600">Threshold tuning, timing presets (§9), and sensor simulator controls</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="neo-btn px-4 py-1.5 text-xs bg-[#111111] text-white">
            <Save size={14} /> SAVE SETTINGS
          </button>
        </div>
      </div>

      {/* Preset Switcher (§2, §9) */}
      <div className="neo-card p-5">
        <h2 className="font-heading font-bold text-base uppercase border-b-2 border-ink pb-2 mb-4 flex items-center justify-between">
          <span>Operational Preset</span>
          <span className="text-xs font-mono text-neutral-500">Locked Decision D10</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setPreset('demo')}
            className={`p-4 border-2 border-ink text-left transition-all ${preset === 'demo' ? 'bg-[#F2C94C]/20 shadow-neo' : 'bg-white opacity-60'}`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-sm">DEMO PRESET</span>
              {preset === 'demo' && <span className="px-2 py-0.5 bg-[#111111] text-white text-[10px] font-mono">SELECTED</span>}
            </div>
            <p className="text-xs text-neutral-600">
              Aggressive timings: alerts fire in 1-2 minutes for live demonstrations. Ideal for evaluation.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setPreset('production')}
            className={`p-4 border-2 border-ink text-left transition-all ${preset === 'production' ? 'bg-[#2F6FDE]/20 shadow-neo' : 'bg-white opacity-60'}`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-sm">PRODUCTION PRESET</span>
              {preset === 'production' && <span className="px-2 py-0.5 bg-[#111111] text-white text-[10px] font-mono">SELECTED</span>}
            </div>
            <p className="text-xs text-neutral-600">
              Conservative timings: 15-minute grace & idle windows to prevent false positive alerts during regular campus operation.
            </p>
          </button>
        </div>
      </div>

      {/* Thresholds Table */}
      <div className="neo-card p-5">
        <h2 className="font-heading font-bold text-base uppercase border-b-2 border-ink pb-2 mb-4">
          Timing Threshold Values (Seconds / Minutes)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          <div className="space-y-1">
            <label className="text-neutral-600 block">CAMERA FRESHNESS WINDOW (sec)</label>
            <input type="number" defaultValue={15} className="w-full border-ink p-2 bg-[#F4F1EA]" />
          </div>
          <div className="space-y-1">
            <label className="text-neutral-600 block">SENSOR FRESHNESS WINDOW (sec)</label>
            <input type="number" defaultValue={30} className="w-full border-ink p-2 bg-[#F4F1EA]" />
          </div>
          <div className="space-y-1">
            <label className="text-neutral-600 block">IDLE ENERGY ALERT THRESHOLD (min)</label>
            <input type="number" defaultValue={preset === 'demo' ? 1 : 15} className="w-full border-ink p-2 bg-[#F4F1EA]" />
          </div>
          <div className="space-y-1">
            <label className="text-neutral-600 block">ANOMALY TRIGGER THRESHOLD (min)</label>
            <input type="number" defaultValue={preset === 'demo' ? 2 : 15} className="w-full border-ink p-2 bg-[#F4F1EA]" />
          </div>
        </div>
      </div>
    </div>
  );
};
