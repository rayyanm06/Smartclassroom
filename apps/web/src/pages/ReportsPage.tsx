import React from 'react';
import { Printer, Download } from 'lucide-react';

export const ReportsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="border-ink bg-white p-4 shadow-neo flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="neo-header-strip inline-block mb-2">AUDIT & COMPLIANCE · REPORT EXPORTS</span>
          <h1 className="text-2xl font-bold font-heading uppercase tracking-tight">Facility Reports</h1>
          <p className="text-sm text-neutral-600">Print-formatted classroom audits and administrative CSV records</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="neo-btn px-3 py-1.5 text-xs bg-white" onClick={() => window.print()}>
            <Printer size={14} /> PRINT REPORT
          </button>
          <button className="neo-btn px-3 py-1.5 text-xs bg-[#111111] text-white">
            <Download size={14} /> EXPORT COMPLIANCE CSV
          </button>
        </div>
      </div>

      <div className="neo-card p-6 border-ink">
        <div className="border-b-2 border-ink pb-4 mb-6 text-center">
          <h2 className="font-heading font-black text-xl uppercase">CAMPUS RESOURCE AUDIT SUMMARY</h2>
          <p className="text-xs font-mono text-neutral-600 mt-1">Generated: 2026-09-29 10:00 IST · Standard College Compliance Spec</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-xs font-mono">
          <div className="p-3 bg-[#F4F1EA] border border-neutral-300">
            <span className="text-neutral-500 block">TOTAL ROOM HOURS</span>
            <span className="text-lg font-bold">120 hrs</span>
          </div>
          <div className="p-3 bg-[#F4F1EA] border border-neutral-300">
            <span className="text-neutral-500 block">UTILIZED HOURS</span>
            <span className="text-lg font-bold">78 hrs (65%)</span>
          </div>
          <div className="p-3 bg-[#F4F1EA] border border-neutral-300">
            <span className="text-neutral-500 block">ENERGY WASTED</span>
            <span className="text-lg font-bold">14.2 kWh</span>
          </div>
          <div className="p-3 bg-[#F4F1EA] border border-neutral-300">
            <span className="text-neutral-500 block">TOTAL ANOMALIES</span>
            <span className="text-lg font-bold">3 Incidents</span>
          </div>
        </div>

        <div className="p-12 border-2 border-dashed border-neutral-300 text-center bg-neutral-50 font-mono text-xs text-neutral-600">
          Print-friendly tabular breakdown with individual classroom audit trails.
        </div>
      </div>
    </div>
  );
};
