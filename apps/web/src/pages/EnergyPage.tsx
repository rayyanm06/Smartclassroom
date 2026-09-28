import React from 'react';

export const EnergyPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="border-ink bg-white p-4 shadow-neo flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="neo-header-strip inline-block mb-2">ENERGY CONSERVATION · APPLIANCE ENGINE</span>
          <h1 className="text-2xl font-bold font-heading uppercase tracking-tight">Energy Recommendations</h1>
          <p className="text-sm text-neutral-600">Pure-function energy waste detection (§11) with remote appliance dispatch</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs bg-amber-100 text-amber-900 border border-amber-400 px-3 py-1 font-bold">
            EST. CURRENT WASTE: ~2.4 kWh
          </span>
        </div>
      </div>

      {/* Recommendations Feed */}
      <div className="space-y-4">
        {[
          {
            room: 'B203',
            block: 'Block B · Floor 2',
            headline: 'Classroom appears unoccupied while AC and lights are ON.',
            context: 'Scheduled 10:00–11:00 (Operating Systems). Now 11:25. People: 0. PIR: no movement.',
            idle: 25,
            severity: 'critical',
            waste: '0.75 kWh',
            acOn: true,
            lightOn: true,
          },
          {
            room: 'C102',
            block: 'Block C · Floor 1',
            headline: 'Lights active in empty seminar hall.',
            context: 'No scheduled class. Idle since 10:45 (18 min). People: 0.',
            idle: 18,
            severity: 'warning',
            waste: '0.12 kWh',
            acOn: false,
            lightOn: true,
          },
        ].map((rec) => (
          <div key={rec.room} className="neo-card p-5 border-l-8 border-l-[#D64545]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b-2 border-ink pb-3 mb-3">
              <div className="flex items-center gap-3">
                <span className="font-mono text-2xl font-bold">{rec.room}</span>
                <span className="text-xs text-neutral-500 font-mono">{rec.block}</span>
                <span className="px-2 py-0.5 bg-[#D64545] text-white font-mono text-[10px] font-bold uppercase">
                  {rec.severity} · {rec.idle} MIN IDLE
                </span>
              </div>
              <div className="font-mono text-xs text-neutral-600">
                Est. Wastage: <strong className="text-[#111111]">{rec.waste}</strong>
              </div>
            </div>

            <p className="text-sm font-bold text-[#111111] mb-1">{rec.headline}</p>
            <p className="text-xs text-neutral-600 font-mono mb-4">{rec.context}</p>

            <div className="flex flex-wrap items-center gap-3">
              {rec.acOn && (
                <button className="neo-btn px-3 py-1.5 text-xs bg-[#D64545] text-white">
                  TURN OFF AC
                </button>
              )}
              {rec.lightOn && (
                <button className="neo-btn px-3 py-1.5 text-xs bg-[#111111] text-white">
                  TURN OFF LIGHTS
                </button>
              )}
              <span className="text-[10px] text-neutral-500 font-mono ml-auto">
                Commands poll every 5s & ack before alert auto-resolves
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
