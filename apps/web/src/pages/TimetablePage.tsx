import React from 'react';
import { Plus } from 'lucide-react';

export const TimetablePage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="border-ink bg-white p-4 shadow-neo flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="neo-header-strip inline-block mb-2">ACADEMIC SCHEDULE · TIMETABLE MATRIX</span>
          <h1 className="text-2xl font-bold font-heading uppercase tracking-tight">Timetable Management</h1>
          <p className="text-sm text-neutral-600">Weekly schedule master (Mon–Sat) with real-time overlap conflict prevention (409)</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="neo-btn px-3 py-1.5 text-xs bg-[#111111] text-white">
            <Plus size={14} /> ADD SCHEDULE ENTRY
          </button>
        </div>
      </div>

      <div className="neo-card p-4">
        <div className="flex items-center justify-between border-b-2 border-ink pb-3 mb-4">
          <div className="flex items-center gap-3">
            <span className="font-heading font-bold uppercase text-sm">SELECT ROOM:</span>
            <select className="border-ink px-3 py-1 bg-[#F4F1EA] text-sm font-mono font-bold">
              <option value="A101">CLASSROOM A101 (Block A · Fl 1)</option>
              <option value="B201">CLASSROOM B201 (Block B · Fl 2)</option>
              <option value="C101">CLASSROOM C101 (Block C · Fl 1)</option>
            </select>
          </div>
          <span className="text-xs font-mono text-neutral-500">TIMEZONE: Asia/Kolkata (IST)</span>
        </div>

        {/* Timetable Weekly Grid Mock */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#111111] text-white font-mono uppercase">
                <th className="p-2.5 border-r border-neutral-700">Time Slot</th>
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day) => (
                  <th key={day} className="p-2.5 border-r border-neutral-700 last:border-r-0">{day}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-300 font-mono">
              {[
                { time: '09:00 - 10:00', mon: 'CS301 (DBMS)', tue: '—', wed: 'CS301 (DBMS)', thu: '—', fri: 'CS305 (OS)', sat: '—' },
                { time: '10:00 - 11:00', mon: 'CS302 (CN)', tue: 'CS303 (SE)', wed: '—', thu: 'CS302 (CN)', fri: '—', sat: 'LAB-A' },
                { time: '11:00 - 12:00', mon: 'CS304 (AI)', tue: 'CS304 (AI)', wed: 'CS302 (CN)', thu: '—', fri: 'CS301 (DBMS)', sat: 'LAB-A' },
                { time: '13:00 - 14:00', mon: 'LUNCH BREAK', tue: 'LUNCH BREAK', wed: 'LUNCH BREAK', thu: 'LUNCH BREAK', fri: 'LUNCH BREAK', sat: '—' },
                { time: '14:00 - 16:00', mon: 'LAB B1 (NETWORKS)', tue: '—', wed: 'LAB B2 (DATABASE)', thu: '—', fri: 'SEMINAR', sat: '—' },
              ].map((slot, idx) => (
                <tr key={idx} className="hover:bg-neutral-50">
                  <td className="p-2.5 font-bold bg-[#F4F1EA] border-r border-neutral-300 text-neutral-700">{slot.time}</td>
                  <td className="p-2.5 border-r border-neutral-300">{slot.mon}</td>
                  <td className="p-2.5 border-r border-neutral-300">{slot.tue}</td>
                  <td className="p-2.5 border-r border-neutral-300">{slot.wed}</td>
                  <td className="p-2.5 border-r border-neutral-300">{slot.thu}</td>
                  <td className="p-2.5 border-r border-neutral-300">{slot.fri}</td>
                  <td className="p-2.5">{slot.sat}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
