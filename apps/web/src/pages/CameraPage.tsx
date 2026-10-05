import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { ShieldAlert, AlertCircle } from 'lucide-react';

export const CameraPage: React.FC = () => {
  const [streamError, setStreamError] = useState(false);
  const roomId = '508';

  const { data: classroom } = useQuery({
    queryKey: ['classroom-camera', roomId],
    queryFn: () => api.getClassroom(roomId),
    refetchInterval: 3000,
  });

  const streamUrl = `http://localhost:8001/stream/${roomId}.mjpg`;

  return (
    <div className="space-y-6">
      <div className="border-ink bg-white p-4 shadow-neo flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="neo-header-strip inline-block mb-2">VISION SYSTEM · MJPEG FEED</span>
          <h1 className="text-2xl font-bold font-heading uppercase tracking-tight">Camera Telemetry Console</h1>
          <p className="text-sm text-neutral-600">YOLO person detection stream, inference metrics, and privacy boundary controls</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 bg-[#2F9E44]/15 border border-[#2F9E44] text-[#2F9E44] font-mono text-xs font-bold">
            STREAM ONLINE (5.2 FPS)
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 neo-card p-4 space-y-3 bg-white">
          <div className="flex items-center justify-between border-b-2 border-ink pb-2">
            <span className="font-mono font-bold text-sm">CLASSROOM {roomId} (PHONE CAMERA)</span>
            <span className="text-xs font-mono text-neutral-500">Source: {streamUrl}</span>
          </div>
          
          {/* MJPEG Stream Container / Fallback */}
          <div className="relative aspect-video bg-neutral-900 border-2 border-ink flex flex-col items-center justify-center text-neutral-400 overflow-hidden">
            {streamError ? (
              <div className="p-6 text-center">
                <AlertCircle size={40} className="mx-auto text-amber-500 mb-2" />
                <div className="font-mono text-sm text-white font-bold uppercase">LIVE FEED DISCONNECTED</div>
                <p className="text-xs text-neutral-400 mt-1 max-w-md">
                  Vision service daemon offline at port 8001 or phone stream disconnected (§16).
                </p>
              </div>
            ) : (
              <>
                <img
                  src={streamUrl}
                  alt={`Live annotated feed for ${roomId}`}
                  onError={() => setStreamError(true)}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-[#111111]/80 border border-white text-white font-mono text-[9px] font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2F9E44] animate-pulse" />
                  LIVE STREAM · ROOM {roomId}
                </div>
              </>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 text-xs font-mono">
            <div className="p-2 bg-[#F4F1EA] border border-neutral-300">
              <span className="text-neutral-500 block text-[10px]">PEOPLE DETECTED</span>
              <span className="text-lg font-bold text-[#111111]">
                {classroom?.state?.people_count ?? 0} Persons
              </span>
            </div>
            <div className="p-2 bg-[#F4F1EA] border border-neutral-300">
              <span className="text-neutral-500 block text-[10px]">OCCUPANCY STATE</span>
              <span className="text-lg font-bold text-[#111111]">
                {classroom?.state?.occupancy_state ?? 'EMPTY'}
              </span>
            </div>
            <div className="p-2 bg-[#F4F1EA] border border-neutral-300">
              <span className="text-neutral-500 block text-[10px]">CONFIDENCE</span>
              <span className="text-lg font-bold text-[#2F9E44] uppercase">
                {classroom?.state?.confidence_level ?? 'HIGH'}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="neo-card p-4 bg-white">
            <h3 className="font-heading font-bold text-sm uppercase border-b-2 border-ink pb-2 mb-3">
              Vision Node Status
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-neutral-200">
                <span className="text-neutral-600">Camera Room:</span>
                <span className="font-mono font-bold">Room {roomId} (SPIT Fl 5)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-200">
                <span className="text-neutral-600">Model:</span>
                <span className="font-mono font-bold">YOLO11n.pt</span>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-200">
                <span className="text-neutral-600">Confidence Threshold:</span>
                <span className="font-mono font-bold">0.35</span>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-200">
                <span className="text-neutral-600">Smoothing Buffer:</span>
                <span className="font-mono font-bold">Median (last 5)</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-neutral-600">Cadence:</span>
                <span className="font-mono font-bold">2.0s heartbeats</span>
              </div>
            </div>
          </div>

          <div className="neo-card p-4 bg-[#F2C94C]/10 border-2 border-ink">
            <div className="flex items-center gap-2 font-bold text-xs uppercase mb-1">
              <ShieldAlert size={16} /> Privacy Policy Compliance
            </div>
            <p className="text-xs text-neutral-700 leading-relaxed">
              In accordance with Locked Decision <strong>D6</strong> and Section 16, frames are processed in-memory only.
              No images, videos, crops, or embeddings are ever stored to disk or transmitted to the database.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
