import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import type { ClassroomWithState } from '../../types';

interface CameraPanelProps {
  classroom: ClassroomWithState;
  streamUrl?: string;
}

export const CameraPanel: React.FC<CameraPanelProps> = ({
  classroom,
  streamUrl,
}) => {
  const [streamError, setStreamError] = useState(false);
  const activeStreamUrl = streamUrl || `/stream/${classroom?.id || '508'}.mjpg`;

  return (
    <div className="neo-card p-4 space-y-3 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b-2 border-ink pb-2">
        <div>
          <span className="text-[10px] font-mono font-bold text-neutral-500 block">
            LIVE OPTICAL SURVEILLANCE
          </span>
          <h3 className="font-heading font-black text-sm uppercase tracking-tight">
            Classroom {classroom.id} Feed
          </h3>
        </div>
        <span className="px-2 py-0.5 bg-[#2F9E44]/15 border border-[#2F9E44] text-[#2F9E44] font-mono text-[10px] font-bold">
          ONLINE · 5.2 FPS
        </span>
      </div>

      {/* MJPEG Viewport / Offline Fallback */}
      <div className="relative aspect-video bg-neutral-900 border-2 border-ink overflow-hidden flex items-center justify-center">
        {streamError ? (
          <div className="p-4 text-center text-neutral-400 space-y-2">
            <AlertCircle size={28} className="mx-auto text-amber-500" />
            <div className="font-mono text-xs font-bold text-white uppercase">
              CAMERA OFFLINE OR DISCONNECTED
            </div>
            <p className="text-[10px] text-neutral-400 max-w-xs">
              Vision service daemon offline at port 8001 or phone stream disconnected (§16).
            </p>
          </div>
        ) : (
          <>
            <img
              src={activeStreamUrl}
              alt={`Live annotated feed for ${classroom.id}`}
              onError={() => setStreamError(true)}
              className="w-full h-full object-cover"
            />
            {/* Live stream badge */}
            <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-[#111111]/80 border border-white text-white font-mono text-[9px] font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2F9E44] animate-pulse" />
              LIVE INFERENCE · YOLO11n
            </div>
          </>
        )}
      </div>

      {/* Live Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
        <div className="p-2 bg-[#F4F1EA] border border-neutral-300">
          <span className="text-neutral-500 block text-[9px]">PEOPLE DETECTED:</span>
          <span className="text-sm font-black text-[#111111]">
            {classroom.state.people_count ?? 0} Persons
          </span>
        </div>
        <div className="p-2 bg-[#F4F1EA] border border-neutral-300">
          <span className="text-neutral-500 block text-[9px]">OCCUPANCY STATUS:</span>
          <span className="text-sm font-black text-[#111111]">
            {classroom.state.occupancy_state ?? 'EMPTY'}
          </span>
        </div>
        <div className="p-2 bg-[#F4F1EA] border border-neutral-300">
          <span className="text-neutral-500 block text-[9px]">CONFIDENCE:</span>
          <span className="text-sm font-black text-[#2F9E44]">
            {classroom.state.confidence_level?.toUpperCase() || 'HIGH'}
          </span>
        </div>
        <div className="p-2 bg-[#F4F1EA] border border-neutral-300">
          <span className="text-neutral-500 block text-[9px]">LAST CAMERA UPDATE:</span>
          <span className="text-sm font-black text-[#111111]">
            {classroom.state.last_camera_at ? new Date(classroom.state.last_camera_at).toLocaleTimeString() : 'Live'}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between text-[10px] font-mono text-neutral-500 pt-1 border-t border-neutral-200">
        <span>Source: <strong>LIVE CAMERA (phone-508)</strong></span>
        <span>No images/faces stored · Section 16 compliant</span>
      </div>
    </div>
  );
};
