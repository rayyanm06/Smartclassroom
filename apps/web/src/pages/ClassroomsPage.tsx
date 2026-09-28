import React from 'react';
import { Search, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';

export const ClassroomsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="border-ink bg-white p-4 shadow-neo flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="neo-header-strip inline-block mb-2">INVENTORY · ALL ROOMS</span>
          <h1 className="text-2xl font-bold font-heading uppercase tracking-tight">Classrooms Directory</h1>
          <p className="text-sm text-neutral-600">Hardware configuration, telemetry endpoints, and physical attributes</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="neo-btn px-3 py-1.5 text-xs bg-[#111111] text-white">
            ADD CLASSROOM
          </button>
        </div>
      </div>

      <div className="neo-card p-4 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-2.5 text-neutral-400" size={16} />
          <input
            type="text"
            placeholder="Search by room code, block, floor..."
            className="w-full pl-9 pr-3 py-1.5 border-ink bg-[#F4F1EA] text-sm focus:outline-none"
          />
        </div>
        <button className="neo-btn px-4 py-1.5 text-xs bg-white">
          <Filter size={14} /> FILTER BY BLOCK
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {['A101', 'A102', 'B201', 'B202', 'C101', 'C102', 'D101', 'D102'].map((room) => (
          <Link
            key={room}
            to={`/classrooms/${room}`}
            className="neo-card p-4 hover:translate-x-0.5 hover:translate-y-0.5 transition-all block group"
          >
            <div className="flex items-center justify-between border-b-2 border-ink pb-2 mb-3">
              <span className="font-mono text-xl font-bold text-[#111111]">{room}</span>
              <span className="px-2 py-0.5 text-[10px] font-bold border border-[#2F9E44] text-[#2F9E44] bg-[#2F9E44]/10">
                ACTIVE
              </span>
            </div>
            <div className="space-y-1.5 text-xs text-neutral-600">
              <div className="flex justify-between">
                <span>Block / Floor:</span>
                <span className="font-mono text-[#111111]">Block {room[0]} · Floor {room[1]}</span>
              </div>
              <div className="flex justify-between">
                <span>Capacity:</span>
                <span className="font-mono text-[#111111]">60 seats</span>
              </div>
              <div className="flex justify-between">
                <span>Camera:</span>
                <span className="font-mono text-[#111111]">{room === 'A101' ? 'Installed (Phone)' : 'None (PIR only)'}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};
