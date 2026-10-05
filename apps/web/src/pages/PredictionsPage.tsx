import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, API_BASE } from '../services/api';
import { Info, Sparkles, CheckCircle2, User } from 'lucide-react';

const DAYS = [
  { label: 'Monday', value: 0 },
  { label: 'Tuesday', value: 1 },
  { label: 'Wednesday', value: 2 },
  { label: 'Thursday', value: 3 },
  { label: 'Friday', value: 4 },
];

export const PredictionsPage: React.FC = () => {
  const [selectedRoom, setSelectedRoom] = useState<string>('508');
  const [selectedDay, setSelectedDay] = useState<number>(0);
  const [selectedHour, setSelectedHour] = useState<number>(11);

  const { data: classrooms = [] } = useQuery({
    queryKey: ['prediction-classrooms'],
    queryFn: () => api.getClassrooms(),
  });

  const activeRoomId = classrooms.some((c) => c.id === selectedRoom)
    ? selectedRoom
    : classrooms[0]?.id || '508';

  const { data: prediction } = useQuery({
    queryKey: ['occupancy-prediction', activeRoomId, selectedDay, selectedHour],
    queryFn: async () => {
      const res = await fetch(
        `${API_BASE}/api/predictions/occupancy?classroom_id=${activeRoomId}&day_of_week=${selectedDay}&hour=${selectedHour}`
      );
      if (!res.ok) return null;
      return res.json();
    },
  });

  const currentClassroom = classrooms.find((c) => c.id === activeRoomId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-ink bg-white p-4 shadow-neo flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="neo-header-strip inline-block mb-2">
            MACHINE LEARNING · PROBABILISTIC OCCUPANCY
          </span>
          <h1 className="text-2xl font-black font-heading uppercase tracking-tight">
            Occupancy Predictions Engine
          </h1>
          <p className="text-xs text-neutral-600 font-mono">
            Multivariate prediction engine using college timetable schedule, room type, and historical occupancy
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-2.5 py-1 bg-[#2F9E44]/15 border border-[#2F9E44] text-[#2F9E44] font-mono text-xs font-bold flex items-center gap-1.5">
            <Sparkles size={14} /> MODEL ACTIVE
          </span>
        </div>
      </div>

      {/* Mandatory Transparent Data Banner (§15) */}
      <div className="p-3 bg-[#F2C94C]/25 border-2 border-ink flex items-start gap-3">
        <Info className="text-amber-800 shrink-0 mt-0.5" size={18} />
        <div className="text-xs text-amber-950 font-mono">
          <strong className="uppercase">Timetable Intelligence:</strong> Predictions fuse academic timetable slot sessions with empirical occupancy patterns. Answering: <em>"How likely is this classroom to be occupied at this time?"</em>
        </div>
      </div>

      {/* Interactive Prediction Console */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 1/3: Input Controls */}
        <div className="neo-card p-4 bg-white space-y-4">
          <h2 className="font-heading font-black text-sm uppercase border-b-2 border-ink pb-2">
            Prediction Parameters
          </h2>

          <div className="space-y-3 font-mono text-xs">
            <div>
              <label className="block text-neutral-600 mb-1 font-bold">1. CLASSROOM / LAB:</label>
              <select
                value={activeRoomId}
                onChange={(e) => setSelectedRoom(e.target.value)}
                className="w-full border-ink p-2 bg-[#F4F1EA] font-bold"
              >
                {classrooms.map((c) => (
                  <option key={c.id} value={c.id}>
                    Room {c.id} — {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-neutral-600 mb-1 font-bold">2. DAY OF WEEK:</label>
              <div className="grid grid-cols-5 gap-1">
                {DAYS.map((d) => (
                  <button
                    key={d.value}
                    onClick={() => setSelectedDay(d.value)}
                    className={`p-1.5 border-2 text-[10px] font-bold ${
                      selectedDay === d.value
                        ? 'bg-[#111111] text-white border-ink'
                        : 'bg-[#F4F1EA] text-neutral-700 border-neutral-300'
                    }`}
                  >
                    {d.label.slice(0, 3)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-neutral-600 font-bold">3. TIME OF DAY:</label>
                <span className="font-bold text-neutral-900 bg-neutral-200 px-2 py-0.5">
                  {selectedHour}:00 - {selectedHour + 1}:00
                </span>
              </div>
              <input
                type="range"
                min={8}
                max={18}
                value={selectedHour}
                onChange={(e) => setSelectedHour(Number(e.target.value))}
                className="w-full accent-black cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-neutral-400 mt-1">
                <span>08:00</span>
                <span>13:00</span>
                <span>18:00</span>
              </div>
            </div>
          </div>

          {currentClassroom && (
            <div className="p-3 bg-[#F4F1EA] border border-neutral-300 text-xs font-mono space-y-1">
              <div>Type: <strong>{currentClassroom.room_type.toUpperCase()}</strong></div>
              <div>Floor: <strong>Floor {currentClassroom.floor}</strong></div>
              <div>Capacity: <strong>{currentClassroom.capacity} Seats</strong></div>
            </div>
          )}
        </div>

        {/* Right 2/3: Prediction Output Card */}
        <div className="lg:col-span-2 neo-card p-5 bg-white space-y-4">
          <div className="flex items-center justify-between border-b-2 border-ink pb-2">
            <span className="text-xs font-mono font-bold text-neutral-500 uppercase">
              PREDICTED STATE OUTPUT
            </span>
            <span className="text-xs font-mono font-bold bg-[#111111] text-white px-2 py-0.5">
              ROOM {activeRoomId} · {DAYS.find((d) => d.value === selectedDay)?.label} {selectedHour}:00
            </span>
          </div>

          {prediction && (
            <div className="space-y-4">
              {/* Primary Gauge / KPI */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-[#F4F1EA] border-2 border-ink text-center space-y-1">
                  <span className="font-mono text-xs text-neutral-600 block">
                    P(OCCUPIED) PROBABILITY
                  </span>
                  <div className="text-4xl font-black font-heading text-[#111111]">
                    {Math.round(prediction.occupancy_probability * 100)}%
                  </div>
                  <span className="text-[10px] font-mono text-[#2F9E44] font-bold block">
                    {prediction.occupancy_probability > 0.7
                      ? '● HIGH OCCUPANCY LIKELY'
                      : prediction.occupancy_probability > 0.3
                      ? '● MODERATE UTILIZATION'
                      : '○ LOW / UNLIKELY'}
                  </span>
                </div>

                <div className="p-4 bg-[#F4F1EA] border-2 border-ink text-center space-y-1">
                  <span className="font-mono text-xs text-neutral-600 block">
                    EXPECTED HEADCOUNT
                  </span>
                  <div className="text-4xl font-black font-heading text-[#111111]">
                    ~{prediction.expected_headcount}
                  </div>
                  <span className="text-[10px] font-mono text-neutral-500 font-bold block">
                    Out of {prediction.classroom_capacity} Seats
                  </span>
                </div>
              </div>

              {/* Schedule Context from Timetable */}
              <div className="p-4 border-2 border-ink bg-white space-y-2">
                <h3 className="font-heading font-black text-xs uppercase text-neutral-600">
                  Timetable Schedule Cross-Reference
                </h3>
                {prediction.scheduled_class ? (
                  <div className="space-y-1.5 font-mono text-xs">
                    <div className="flex items-center gap-2 text-sm font-bold text-[#111111]">
                      <CheckCircle2 size={16} className="text-[#2F9E44]" />
                      <span>{prediction.subject}</span>
                      <span className="text-[10px] px-1.5 py-0.5 bg-[#228BE6] text-white uppercase">
                        {prediction.class_type}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-neutral-600">
                      <User size={14} />
                      <span>Faculty: {prediction.faculty}</span>
                    </div>
                  </div>
                ) : (
                  <div className="font-mono text-xs text-neutral-500 italic">
                    No academic lecture scheduled in room {activeRoomId} for this time slot.
                  </div>
                )}
              </div>

              {/* Feature Inputs */}
              <div>
                <span className="text-[11px] font-mono text-neutral-500 uppercase block mb-2 font-bold">
                  Inference Inputs Considered:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-xs">
                  <div className="p-2 bg-[#F4F1EA] border border-neutral-300">
                    <span className="text-[9px] text-neutral-500 block">TIMETABLE SESSION:</span>
                    <strong className="text-neutral-900">
                      {prediction.scheduled_class ? 'ACTIVE' : 'NONE'}
                    </strong>
                  </div>
                  <div className="p-2 bg-[#F4F1EA] border border-neutral-300">
                    <span className="text-[9px] text-neutral-500 block">ROOM TYPE:</span>
                    <strong className="text-neutral-900 uppercase">
                      {prediction.class_type}
                    </strong>
                  </div>
                  <div className="p-2 bg-[#F4F1EA] border border-neutral-300">
                    <span className="text-[9px] text-neutral-500 block">TIME SLOT:</span>
                    <strong className="text-neutral-900">
                      {prediction.time_slot}
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
