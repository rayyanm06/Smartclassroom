import React, { useState } from 'react';
import { AlertCircle, Video, CheckCircle2 } from 'lucide-react';
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
  const isOnline = Boolean(classroom.state?.camera_online) && !streamError;

  return (
    <div className="neo-card p-4 space-y-3 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b-2 border-ink pb-2">
        <div>
          <span className="text-[10px] font-mono font-bold text-neutral-500 block">
            LIVE OPTICAL MONITORING
          </span>
          <h3 className="font-heading font-black text-sm uppercase tracking-tight flex items-center gap-1.5">
            <Video size={16} /> Classroom {classroom.id} Camera Feed
          </h3>
        </div>
        <span
          className={`px-2 py-0.5 border font-mono text-[10px] font-bold flex items-center gap-1 ${
            isOnline
              ? 'bg-[#2F9E44]/15 border-[#2F9E44] text-[#2F9E44]'
              : 'bg-[#D64545]/15 border-[#D64545] text-[#D64545]'
          }`}
        >
          {isOnline ? (
            <>
              <CheckCircle2 size={12} /> CAMERA ONLINE
            </>
          ) : (
            <>
              <AlertCircle size={12} /> CAMERA OFFLINE
            </>
          )}
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
            <p className="text-[11px] text-neutral-400 max-w-xs mx-auto">
              The camera feed is currently not reachable. The phone or RTSP camera may be disconnected.
            </p>
          </div>
        ) : (
          <>
            <img
              src={activeStreamUrl}
              alt={`Live video feed for ${classroom.id}`}
              onError={() => setStreamError(true)}
              className="w-full h-full object-cover"
            />
            {/* Live stream badge */}
            <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-[#111111]/85 border border-white text-white font-mono text-[9px] font-bold flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-[#2F9E44] animate-pulse' : 'bg-[#D64545]'}`} />
              {isOnline ? 'LIVE INFERENCE · YOLO11n' : 'STREAM WAITING'}
            </div>
          </>
        )}
      </div>

      {/* Live Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
        <div className="p-2 bg-[#F4F1EA] border border-neutral-300">
          <span className="text-neutral-500 block text-[9px]">PEOPLE DETECTED:</span>
          <span className="text-sm font-black text-[#111111]">
            {isOnline && classroom.state.people_count !== null
              ? `${classroom.state.people_count} ${classroom.state.people_count === 1 ? 'Person' : 'People'}`
              : 'UNAVAILABLE'}
          </span>
        </div>
        <div className="p-2 bg-[#F4F1EA] border border-neutral-300">
          <span className="text-neutral-500 block text-[9px]">CONFIRMED OCCUPANCY:</span>
          <span className="text-sm font-black text-[#111111]">
            {classroom.state.occupancy_state ?? 'UNKNOWN'}
          </span>
        </div>
        <div className="p-2 bg-[#F4F1EA] border border-neutral-300">
          <span className="text-neutral-500 block text-[9px]">DETECTION RELIABILITY:</span>
          <span
            className={`text-sm font-black ${
              isOnline ? 'text-[#2F9E44]' : 'text-neutral-500'
            }`}
          >
            {isOnline ? (classroom.state.confidence_level?.toUpperCase() || 'HIGH') : 'LOW'}
          </span>
        </div>
        <div className="p-2 bg-[#F4F1EA] border border-neutral-300">
          <span className="text-neutral-500 block text-[9px]">LAST CAMERA UPDATE:</span>
          <span className="text-sm font-black text-[#111111]">
            {classroom.state.last_camera_at
              ? new Date(classroom.state.last_camera_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
              : 'Unavailable'}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between text-[10px] font-mono text-neutral-500 pt-1 border-t border-neutral-200">
        <span>Source: <strong>Phone Camera (Room 508)</strong></span>
        <span>Privacy protected: counts only · No face data stored</span>
      </div>
    </div>
  );
};
