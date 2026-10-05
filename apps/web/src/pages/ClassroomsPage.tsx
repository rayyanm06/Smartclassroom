import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { RoomPlate } from '../components/features/RoomPlate';
import { Search } from 'lucide-react';

export const ClassroomsPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [selectedBlock, setSelectedBlock] = useState('all');
  const [selectedFloor, setSelectedFloor] = useState('all');

  const { data: classrooms = [], isLoading } = useQuery({
    queryKey: ['classrooms-list'],
    queryFn: () => api.getClassrooms(),
    refetchInterval: 5000,
  });

  const filtered = classrooms.filter((c) => {
    const matchesSearch =
      c.id.toLowerCase().includes(search.toLowerCase()) ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.building.toLowerCase().includes(search.toLowerCase());
    const matchesBlock = selectedBlock === 'all' || c.building === selectedBlock;
    const matchesFloor = selectedFloor === 'all' || c.floor.toString() === selectedFloor;
    return matchesSearch && matchesBlock && matchesFloor;
  });

  const blocks = Array.from(new Set(classrooms.map((c) => c.building))).sort();
  const floors = Array.from(new Set(classrooms.map((c) => c.floor))).sort((a, b) => a - b);

  return (
    <div className="space-y-6">
      <div className="border-ink bg-white p-4 shadow-neo flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="neo-header-strip inline-block mb-2">CAMPUS INVENTORY · SENSOR NODES</span>
          <h1 className="text-2xl font-black font-heading uppercase tracking-tight">
            Classrooms Directory
          </h1>
          <p className="text-xs text-neutral-600 font-mono">
            Physical room attributes, sensor capabilities, and live fusion states
          </p>
        </div>
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="px-3 py-1 bg-white border-ink font-bold">
            {classrooms.length} TOTAL ROOMS
          </span>
        </div>
      </div>

      <div className="neo-card p-4 flex flex-col sm:flex-row gap-3 bg-white">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-2.5 text-neutral-400" size={16} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by room code, block, room name..."
            className="w-full pl-9 pr-3 py-1.5 border-ink bg-[#F4F1EA] text-xs font-mono focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setSelectedBlock('all')}
            className={`px-3 py-1.5 text-xs font-mono font-bold border-2 ${
              selectedBlock === 'all' ? 'bg-[#111111] text-white border-ink' : 'bg-white border-neutral-300'
            }`}
          >
            ALL BLOCKS
          </button>
          {blocks.map((blk) => (
            <button
              key={blk}
              onClick={() => setSelectedBlock(blk)}
              className={`px-3 py-1.5 text-xs font-mono font-bold border-2 ${
                selectedBlock === blk ? 'bg-[#111111] text-white border-ink' : 'bg-white border-neutral-300'
              }`}
            >
              {blk.toUpperCase()}
            </button>
          ))}
          <span className="text-neutral-300 mx-1">|</span>
          <select
            value={selectedFloor}
            onChange={(e) => setSelectedFloor(e.target.value)}
            className="px-2.5 py-1.5 text-xs font-mono font-bold border-2 border-ink bg-white"
          >
            <option value="all">ALL FLOORS</option>
            {floors.map((f) => (
              <option key={f} value={f.toString()}>
                FLOOR {f}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="p-12 text-center font-mono text-xs">Loading classroom telemetry...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((room) => (
            <RoomPlate key={room.id} classroom={room} />
          ))}
        </div>
      )}
    </div>
  );
};
