import React from 'react';
import { LayoutDashboard, Users, Zap, Bell, Video, CheckCircle2 } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="border-ink bg-white p-4 shadow-neo flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="neo-header-strip inline-block mb-2">CAMPUS OVERVIEW · LIVE TELEMETRY</span>
          <h1 className="text-2xl font-bold font-heading uppercase tracking-tight">Executive Dashboard</h1>
          <p className="text-sm text-neutral-600">Multi-source occupancy fusion & energy conservation monitoring</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#2F9E44]/15 text-[#2F9E44] border-2 border-[#2F9E44] font-semibold text-xs uppercase">
            <span className="w-2 h-2 rounded-full bg-[#2F9E44] animate-pulse" />
            TELEMETRY ACTIVE
          </span>
          <span className="font-mono text-xs text-neutral-600 bg-neutral-100 px-2 py-1 border border-neutral-300">
            POLL: 3s
          </span>
        </div>
      </div>

      {/* KPI Preview Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {[
          { label: 'TOTAL ROOMS', val: '12', sub: 'Campus-wide', icon: LayoutDashboard },
          { label: 'OCCUPIED', val: '5', sub: 'Verified in use', icon: Users, color: 'text-[#2F9E44]' },
          { label: 'EMPTY', val: '6', sub: 'Idle rooms', icon: CheckCircle2 },
          { label: 'EXPECTED', val: '4', sub: 'Timetable match', icon: CheckCircle2, color: 'text-[#2F6FDE]' },
          { label: 'UNEXPECTED', val: '1', sub: 'Ad-hoc activity', icon: Bell, color: 'text-[#F2A900]' },
          { label: 'ANOMALIES', val: '0', sub: 'Scheduled empty', icon: Bell, color: 'text-[#D64545]' },
          { label: 'ACTIVE ALERTS', val: '2', sub: 'Action required', icon: Zap, color: 'text-[#D64545]' },
          { label: 'CAMERA FEEDS', val: '1 / 1', sub: 'Room A101', icon: Video, color: 'text-[#2F6FDE]' },
        ].map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div key={idx} className="neo-card p-3 flex flex-col justify-between">
              <div className="flex items-center justify-between text-neutral-500 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider">{kpi.label}</span>
                <Icon size={14} className={kpi.color || 'text-neutral-600'} />
              </div>
              <div className={`font-mono text-2xl font-bold ${kpi.color || 'text-[#111111]'}`}>
                {kpi.val}
              </div>
              <div className="text-[10px] text-neutral-500 mt-1 truncate">{kpi.sub}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 neo-card p-5">
          <div className="border-b-2 border-ink pb-3 mb-4 flex items-center justify-between">
            <h2 className="font-heading font-bold text-lg uppercase tracking-tight">Classroom Matrix (By Block)</h2>
            <span className="text-xs font-mono text-neutral-600">Phase 1 Navigation Shell</span>
          </div>
          <div className="p-8 border-2 border-dashed border-neutral-300 text-center bg-neutral-50">
            <p className="font-medium text-neutral-700">Room plates and real-time state cards ready for Phase 2 mock integration.</p>
            <p className="text-xs text-neutral-500 mt-1">States: Occupied, Empty, Expected, Unexpected, Anomaly, Uncertain.</p>
          </div>
        </div>

        <div className="neo-card p-5">
          <div className="border-b-2 border-ink pb-3 mb-4 flex items-center justify-between">
            <h2 className="font-heading font-bold text-lg uppercase tracking-tight">Attention Required</h2>
            <span className="px-2 py-0.5 bg-[#D64545] text-white font-mono text-xs font-bold">2 OPEN</span>
          </div>
          <div className="p-8 border-2 border-dashed border-neutral-300 text-center bg-neutral-50">
            <p className="font-medium text-neutral-700">Real-time alert dispatch list.</p>
            <p className="text-xs text-neutral-500 mt-1">Idle appliances & anomaly monitoring active.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
