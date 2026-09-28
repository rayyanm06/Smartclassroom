import React from 'react';
import { Link } from 'react-router-dom';
import type { ClassroomWithState } from '../../types';
import { OCCUPANCY_STATE_STYLES } from '../../lib/styles';
import { Video } from 'lucide-react';

interface RoomPlateProps {
  classroom: ClassroomWithState;
}

export const RoomPlate: React.FC<RoomPlateProps> = ({ classroom }) => {
  const { state } = classroom;
  const style = OCCUPANCY_STATE_STYLES[state.occupancy_state];

  return (
    <Link
      to={`/classrooms/${classroom.id}`}
      className="neo-card p-3.5 hover:translate-x-0.5 hover:translate-y-0.5 transition-all block group relative bg-white"
    >
      {/* Top Strip: Room Plate Door Number Look */}
      <div className="flex items-center justify-between border-b-2 border-ink pb-2 mb-2.5">
        <div className="flex items-center gap-2">
          <span className="font-mono text-2xl font-black text-[#111111] tracking-tight group-hover:underline">
            {classroom.id}
          </span>
          {classroom.has_camera && (
            <span
              className="p-1 bg-neutral-100 border border-ink text-neutral-800"
              title="Camera Telemetry Node Installed"
            >
              <Video size={12} />
            </span>
          )}
        </div>

        {/* State Stamp Badge (Colour + Text Always) */}
        <span
          className={`px-2 py-0.5 text-[10px] font-bold uppercase font-mono border-2 border-ink ${style.badgeBg} ${style.badgeText} shadow-neo-sm`}
        >
          {style.label}
        </span>
      </div>

      {/* Middle Specs: Physical & Sensor Status */}
      <div className="space-y-1.5 text-xs font-mono">
        <div className="flex items-center justify-between text-neutral-600">
          <span>PEOPLE COUNT:</span>
          <span className="font-bold text-[#111111]">
            {classroom.has_camera && state.people_count !== null
              ? `${state.people_count} pers.`
              : '—'}
          </span>
        </div>

        <div className="flex items-center justify-between text-neutral-600">
          <span>CLIMATE (DHT11):</span>
          <span className="text-[#111111]">
            {state.temperature !== null ? `${state.temperature}°C · ${state.humidity}%` : 'OFFLINE'}
          </span>
        </div>

        <div className="flex items-center justify-between text-neutral-600">
          <span>APPLIANCES:</span>
          <span className="flex items-center gap-1.5 font-bold">
            <span className={state.ac_status ? 'text-[#2F9E44]' : 'text-neutral-400'}>
              AC {state.ac_status ? 'ON' : 'OFF'}
            </span>
            <span>·</span>
            <span className={state.light_status ? 'text-[#2F9E44]' : 'text-neutral-400'}>
              LT {state.light_status ? 'ON' : 'OFF'}
            </span>
          </span>
        </div>
      </div>

      {/* Bottom Reason / Evidence Snippet */}
      <div className="mt-2.5 pt-2 border-t border-neutral-200 text-[10px] text-neutral-600 truncate font-mono">
        {state.reasons[0] || 'Telemetry active and verified'}
      </div>
    </Link>
  );
};
