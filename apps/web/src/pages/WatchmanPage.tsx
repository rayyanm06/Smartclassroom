import React, { useState } from 'react';
import { CheckCircle2, Clock, MapPin, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';

interface WatchmanTaskItem {
  id: string;
  room: string;
  block: string;
  floor: string;
  why: string;
  duration: string;
  severity: 'CRITICAL' | 'WARNING';
}

export const WatchmanPage: React.FC = () => {
  const [tasks, setTasks] = useState<WatchmanTaskItem[]>([
    {
      id: 'task-1',
      room: 'A101',
      block: 'Block A',
      floor: 'Floor 1',
      why: 'AC ON + No people verified by camera & PIR',
      duration: '23 min idle',
      severity: 'CRITICAL',
    },
    {
      id: 'task-2',
      room: 'B203',
      block: 'Block B',
      floor: 'Floor 2',
      why: 'Lights ON + No people detected',
      duration: '17 min idle',
      severity: 'WARNING',
    },
    {
      id: 'task-3',
      room: 'C102',
      block: 'Block C',
      floor: 'Floor 1',
      why: 'Unexpected occupancy — no scheduled class',
      duration: '5 min active',
      severity: 'WARNING',
    },
  ]);

  const handleMarkChecked = (taskId: string) => {
    // Snooze task for 30 minutes (§12)
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  return (
    <div className="min-h-screen bg-[#F4F1EA] text-[#111111] p-3 sm:p-5 max-w-xl mx-auto">
      {/* Top Header: Simple, High-contrast, Mobile First */}
      <header className="border-b-2 border-ink pb-3 mb-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-[#D64545] rounded-full animate-pulse" />
            <span className="font-mono text-xs font-bold tracking-wider text-neutral-600 uppercase">
              CAMPUS PATROL TERMINAL
            </span>
          </div>
          <h1 className="font-heading font-black text-2xl uppercase tracking-tight">Watchman Tasks</h1>
        </div>
        <div className="text-right">
          <span className="font-mono text-xs font-bold bg-[#111111] text-white px-2 py-1">
            {tasks.length} PENDING
          </span>
          <div className="mt-1">
            <Link to="/" className="text-[11px] underline font-mono text-neutral-600">
              Admin View
            </Link>
          </div>
        </div>
      </header>

      {/* Task List */}
      {tasks.length === 0 ? (
        <div className="neo-card p-8 text-center bg-white space-y-3">
          <div className="w-12 h-12 bg-[#2F9E44]/15 border-2 border-[#2F9E44] rounded-full flex items-center justify-center mx-auto text-[#2F9E44]">
            <CheckCircle2 size={24} />
          </div>
          <h2 className="font-heading font-bold text-xl uppercase">ALL CLEAR</h2>
          <p className="text-xs text-neutral-600">No rooms require attention. All idle appliances turned off and scheduled rooms verified.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-mono text-neutral-600">
            <span>PRIORITY ORDER (CRITICAL FIRST)</span>
            <button className="underline flex items-center gap-1" onClick={() => window.location.reload()}>
              <RefreshCw size={12} /> Sync
            </button>
          </div>

          {tasks.map((task) => (
            <div
              key={task.id}
              className={`neo-card p-4 border-l-8 ${task.severity === 'CRITICAL' ? 'border-l-[#D64545]' : 'border-l-[#F2A900]'} space-y-3`}
            >
              {/* WHERE */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-mono text-3xl font-extrabold text-[#111111] tracking-tight">
                    {task.room}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-neutral-600 font-mono">
                    <MapPin size={12} /> {task.block} · {task.floor}
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-block px-2 py-0.5 text-[10px] font-bold text-white font-mono ${task.severity === 'CRITICAL' ? 'bg-[#D64545]' : 'bg-[#F2A900]'}`}
                  >
                    {task.severity}
                  </span>
                  <div className="text-xs font-mono text-neutral-500 mt-1 flex items-center justify-end gap-1">
                    <Clock size={12} /> {task.duration}
                  </div>
                </div>
              </div>

              {/* WHY */}
              <div className="p-2.5 bg-[#F4F1EA] border border-neutral-300 font-mono text-xs font-medium text-neutral-800">
                {task.why}
              </div>

              {/* ACTION: Min 44px touch target (§21) */}
              <button
                type="button"
                onClick={() => handleMarkChecked(task.id)}
                className="w-full neo-btn py-3 text-sm font-bold bg-[#111111] text-white min-h-[44px]"
              >
                [ MARK CHECKED ]
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
