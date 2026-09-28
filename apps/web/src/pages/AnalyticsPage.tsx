import React from 'react';
import { Download } from 'lucide-react';

export const AnalyticsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="border-ink bg-white p-4 shadow-neo flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="neo-header-strip inline-block mb-2">CAMPUS ANALYTICS · 1-MINUTE GRANULARITY</span>
          <h1 className="text-2xl font-bold font-heading uppercase tracking-tight">Occupancy & Resource Analytics</h1>
          <p className="text-sm text-neutral-600">SQL analytics computed over historical occupancy_snapshots (§14)</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-2.5 py-1 bg-neutral-100 border border-neutral-300 font-mono text-xs">
            DATA SOURCE: LIVE & SEED
          </span>
          <button className="neo-btn px-3 py-1.5 text-xs bg-white">
            <Download size={14} /> EXPORT CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="neo-card p-4">
          <div className="text-xs font-bold text-neutral-500 mb-1">CAMPUS UTILIZATION</div>
          <div className="font-mono text-3xl font-bold text-[#111111]">64.2%</div>
          <div className="text-[10px] text-neutral-500 mt-1">Working hours (08:00–18:00)</div>
        </div>

        <div className="neo-card p-4">
          <div className="text-xs font-bold text-neutral-500 mb-1">SCHEDULE ADHERENCE</div>
          <div className="font-mono text-3xl font-bold text-[#2F6FDE]">88.5%</div>
          <div className="text-[10px] text-neutral-500 mt-1">Occupied during scheduled slots</div>
        </div>

        <div className="neo-card p-4">
          <div className="text-xs font-bold text-neutral-500 mb-1">PEAK UTILIZATION HOUR</div>
          <div className="font-mono text-3xl font-bold text-[#F2A900]">11:00 - 12:00</div>
          <div className="text-[10px] text-neutral-500 mt-1">Highest concurrent classroom use</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="neo-card p-5">
          <h2 className="font-heading font-bold text-base uppercase border-b-2 border-ink pb-2 mb-4">
            Daily Utilization Curve (Hourly)
          </h2>
          <div className="p-12 border-2 border-dashed border-neutral-300 text-center bg-neutral-50 font-mono text-xs text-neutral-600">
            Recharts line & area chart will render in Phase 13 using aggregated snapshot data.
          </div>
        </div>

        <div className="neo-card p-5">
          <h2 className="font-heading font-bold text-base uppercase border-b-2 border-ink pb-2 mb-4">
            Underutilized Rooms (&lt; 30% Threshold)
          </h2>
          <div className="p-12 border-2 border-dashed border-neutral-300 text-center bg-neutral-50 font-mono text-xs text-neutral-600">
            Identifies low-attendance classrooms and surplus lecture halls for timetable optimization.
          </div>
        </div>
      </div>
    </div>
  );
};
