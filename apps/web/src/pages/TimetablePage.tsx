import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { Clock, User, Building } from 'lucide-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const TIME_SLOTS = [
  { label: '09:00 - 10:00', start: '09:00:00', end: '10:00:00' },
  { label: '10:00 - 11:00', start: '10:00:00', end: '11:00:00' },
  { label: '11:00 - 11:15', isBreak: true, labelText: 'SHORT BREAK' },
  { label: '11:15 - 12:15', start: '11:15:00', end: '12:15:00' },
  { label: '12:15 - 13:15', isBreak: true, labelText: 'LONG BREAK' },
  { label: '13:15 - 14:15', start: '13:15:00', end: '14:15:00' },
  { label: '14:15 - 15:15', start: '14:15:00', end: '15:15:00' },
  { label: '15:15 - 16:15', start: '15:15:00', end: '16:15:00' },
  { label: '16:15 - 17:15', start: '16:15:00', end: '17:15:00' },
  { label: '17:15 - 18:15', start: '17:15:00', end: '18:15:00' },
];

export const TimetablePage: React.FC = () => {
  const [selectedRoom, setSelectedRoom] = useState<string>('508');

  const { data: classrooms = [] } = useQuery({
    queryKey: ['timetable-classrooms'],
    queryFn: () => api.getClassrooms(),
  });

  const activeRoomId = classrooms.some((c) => c.id === selectedRoom)
    ? selectedRoom
    : classrooms[0]?.id || '508';

  const { data: entries = [] } = useQuery({
    queryKey: ['timetable-entries', activeRoomId],
    queryFn: () => api.getTimetable(activeRoomId),
  });

  const currentClassroom = classrooms.find((c) => c.id === activeRoomId);

  // Helper to find entry matching slot and day
  const getEntryForSlot = (dayIdx: number, slotStart: string) => {
    return entries.find((e) => {
      if (e.day_of_week !== dayIdx) return false;
      const entryStart = e.start_time.slice(0, 5); // "09:00"
      const slotPrefix = slotStart.slice(0, 5);
      return entryStart === slotPrefix;
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-ink bg-white p-4 shadow-neo flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="neo-header-strip inline-block mb-2">
            ACADEMIC SCHEDULE · SPIT TIMETABLE MASTER
          </span>
          <h1 className="text-2xl font-black font-heading uppercase tracking-tight">
            Classroom Timetable Matrix
          </h1>
          <p className="text-xs text-neutral-600 font-mono">
            College master timetable extracted directly from SPIT Computer Engineering schedule
          </p>
        </div>
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="px-3 py-1 bg-[#2F9E44]/15 border border-[#2F9E44] text-[#2F9E44] font-bold">
            {entries.length} SCHEDULED SESSIONS
          </span>
        </div>
      </div>

      {/* Control Bar: Room Selector & Metadata */}
      <div className="neo-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white">
        <div className="flex items-center gap-3">
          <Building size={18} className="text-neutral-600" />
          <span className="font-heading font-black uppercase text-xs">SELECT CLASSROOM:</span>
          <select
            value={activeRoomId}
            onChange={(e) => setSelectedRoom(e.target.value)}
            className="border-ink px-3 py-1.5 bg-[#F4F1EA] text-xs font-mono font-bold focus:outline-none"
          >
            {classrooms.map((c) => (
              <option key={c.id} value={c.id}>
                {c.id} — {c.name} (Fl {c.floor} · Cap {c.capacity} · {c.room_type.toUpperCase()})
                {c.has_camera ? ' [CAMERA NODE]' : ''}
              </option>
            ))}
          </select>
        </div>

        {currentClassroom && (
          <div className="flex items-center gap-4 text-xs font-mono text-neutral-600">
            <span>Building: <strong>{currentClassroom.building}</strong></span>
            <span>Floor: <strong>{currentClassroom.floor}</strong></span>
            <span>Capacity: <strong>{currentClassroom.capacity} seats</strong></span>
          </div>
        )}
      </div>

      {/* Weekly Matrix Table */}
      <div className="neo-card p-4 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#111111] text-white font-mono uppercase">
                <th className="p-3 border-r border-neutral-700 w-32">Time Slot</th>
                {DAYS.map((day) => (
                  <th key={day} className="p-3 border-r border-neutral-700 last:border-r-0 min-w-[170px]">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-300 font-mono">
              {TIME_SLOTS.map((slot, sIdx) => {
                if (slot.isBreak) {
                  return (
                    <tr key={sIdx} className="bg-neutral-100 text-neutral-500 font-bold">
                      <td className="p-2 border-r border-neutral-300 text-[10px] text-center font-mono">
                        {slot.label}
                      </td>
                      <td colSpan={5} className="p-2 text-center text-[10px] tracking-wider font-bold">
                        —— {slot.labelText} ——
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr key={sIdx} className="hover:bg-neutral-50/50">
                    <td className="p-2.5 font-bold bg-[#F4F1EA] border-r border-neutral-300 text-neutral-800 text-[11px] whitespace-nowrap">
                      <Clock size={12} className="inline mr-1 text-neutral-500" />
                      {slot.label}
                    </td>
                    {DAYS.map((_day, dIdx) => {
                      const entry = slot.start ? getEntryForSlot(dIdx, slot.start) : undefined;
                      if (!entry) {
                        return (
                          <td
                            key={dIdx}
                            className="p-2.5 border-r border-neutral-300 last:border-r-0 text-neutral-300 text-center"
                          >
                            —
                          </td>
                        );
                      }

                      const isLab = entry.class_type.toLowerCase() === 'lab';

                      return (
                        <td
                          key={dIdx}
                          className="p-2 border-r border-neutral-300 last:border-r-0 align-top"
                        >
                          <div
                            className={`p-2 border-2 border-ink space-y-1 ${
                              isLab ? 'bg-[#FFE8CC]' : 'bg-[#E7F5FF]'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-heading font-black text-xs text-[#111111]">
                                {entry.subject}
                              </span>
                              <span
                                className={`text-[9px] font-bold px-1 uppercase ${
                                  isLab
                                    ? 'bg-[#FD7E14] text-white'
                                    : 'bg-[#228BE6] text-white'
                                }`}
                              >
                                {entry.class_type}
                              </span>
                            </div>
                            <div className="text-[10px] text-neutral-700 flex items-center gap-1">
                              <User size={10} className="text-neutral-500" />
                              <span>{entry.faculty}</span>
                            </div>
                            {entry.division && (
                              <div className="text-[9px] text-neutral-500">
                                {entry.division} {entry.batch ? `(${entry.batch})` : ''}
                              </div>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
