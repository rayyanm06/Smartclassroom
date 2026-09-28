import React from 'react';
import { Check, CheckCheck, Clock } from 'lucide-react';

export const AlertsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="border-ink bg-white p-4 shadow-neo flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="neo-header-strip inline-block mb-2">INCIDENT LOG · EXCEPTION ENGINE</span>
          <h1 className="text-2xl font-bold font-heading uppercase tracking-tight">Active Alerts & Incidents</h1>
          <p className="text-sm text-neutral-600">Deduplicated event registry with auto-resolution and acknowledgement workflows</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 bg-[#D64545] text-white font-mono text-xs font-bold">
            2 OPEN ALERTS
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {[
          {
            id: 'ALT-1082',
            room: 'B203',
            type: 'ENERGY_AC_IDLE',
            severity: 'CRITICAL',
            headline: 'AC running in empty classroom past threshold',
            detail: 'Room has had zero motion for 25 minutes while AC power is confirmed ON.',
            time: '12 min ago',
            status: 'OPEN',
          },
          {
            id: 'ALT-1081',
            room: 'C102',
            type: 'UNEXPECTED_OCCUPANCY',
            severity: 'WARNING',
            headline: 'Motion detected outside scheduled class hours',
            detail: 'PIR sensor triggered active state; timetable indicates room is unreserved.',
            time: '28 min ago',
            status: 'OPEN',
          },
        ].map((alert) => (
          <div key={alert.id} className="neo-card p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-xs bg-neutral-100 px-1.5 py-0.5 border border-neutral-300">
                  {alert.id}
                </span>
                <span className="font-mono font-bold text-sm text-[#111111]">{alert.room}</span>
                <span className={`px-2 py-0.5 text-[10px] font-bold text-white ${alert.severity === 'CRITICAL' ? 'bg-[#D64545]' : 'bg-[#F2A900]'}`}>
                  {alert.severity}
                </span>
                <span className="text-xs text-neutral-500 font-mono flex items-center gap-1">
                  <Clock size={12} /> {alert.time}
                </span>
              </div>
              <h3 className="font-bold text-sm text-[#111111]">{alert.headline}</h3>
              <p className="text-xs text-neutral-600 font-mono">{alert.detail}</p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button className="neo-btn px-3 py-1.5 text-xs bg-white">
                <Check size={14} /> ACKNOWLEDGE
              </button>
              <button className="neo-btn px-3 py-1.5 text-xs bg-[#111111] text-white">
                <CheckCheck size={14} /> RESOLVE
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
