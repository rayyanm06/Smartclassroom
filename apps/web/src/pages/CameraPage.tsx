import React from 'react';
import { Video, ShieldAlert } from 'lucide-react';

export const CameraPage: React.FC = () => {
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
        <div className="lg:col-span-2 neo-card p-4 space-y-3">
          <div className="flex items-center justify-between border-b-2 border-ink pb-2">
            <span className="font-mono font-bold text-sm">CLASSROOM A101 (PHONE CAMERA)</span>
            <span className="text-xs font-mono text-neutral-500">Source: http://localhost:8001/stream/A101.mjpg</span>
          </div>
          
          {/* MJPEG Stream Container / Fallback */}
          <div className="relative aspect-video bg-neutral-900 border-2 border-ink flex flex-col items-center justify-center text-neutral-400 p-6 text-center">
            <Video size={48} className="text-neutral-600 mb-2" />
            <div className="font-mono text-sm text-white font-bold">LIVE MJPEG FEED (A101)</div>
            <p className="text-xs text-neutral-400 mt-1 max-w-md">
              Annotated stream with person bounding boxes served by <code className="text-amber-400">services/vision</code>.
              No faces, crops, or identities stored (§16).
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 text-xs font-mono">
            <div className="p-2 bg-[#F4F1EA] border border-neutral-300">
              <span className="text-neutral-500 block text-[10px]">PEOPLE DETECTED</span>
              <span className="text-lg font-bold text-[#111111]">7 Persons</span>
            </div>
            <div className="p-2 bg-[#F4F1EA] border border-neutral-300">
              <span className="text-neutral-500 block text-[10px]">INFERENCE LATENCY</span>
              <span className="text-lg font-bold text-[#111111]">42 ms</span>
            </div>
            <div className="p-2 bg-[#F4F1EA] border border-neutral-300">
              <span className="text-neutral-500 block text-[10px]">MODEL CONFIDENCE</span>
              <span className="text-lg font-bold text-[#2F9E44]">94%</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="neo-card p-4">
            <h3 className="font-heading font-bold text-sm uppercase border-b-2 border-ink pb-2 mb-3">
              Vision Node Status
            </h3>
            <div className="space-y-2 text-xs">
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
