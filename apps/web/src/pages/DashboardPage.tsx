import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { KpiStrip } from '../components/features/KpiStrip';
import { RoomPlate } from '../components/features/RoomPlate';
import { CameraPanel } from '../components/features/CameraPanel';
import { AttentionPanel } from '../components/features/AttentionPanel';
import { OccupancyCharts } from '../components/features/OccupancyCharts';
import { OCCUPANCY_STATE_STYLES } from '../lib/styles';
import { Radio, RefreshCw, Layers } from 'lucide-react';
import type { OccupancyState } from '../types';

export const DashboardPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedBlock, setSelectedBlock] = useState<string>('all');

  // TanStack queries with polling cadence per Decision D7
  const { data: summary } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: () => api.getSummary(),
    refetchInterval: 3000,
  });

  const { data: classrooms = [] } = useQuery({
    queryKey: ['dashboard-classrooms'],
    queryFn: () => api.getClassrooms(),
    refetchInterval: 3000,
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ['dashboard-alerts'],
    queryFn: () => api.getAlerts({ status: 'open' }),
    refetchInterval: 3000,
  });

  const { data: curveData = [] } = useQuery({
    queryKey: ['dashboard-curve'],
    queryFn: () => api.getOccupancyCurve(),
    refetchInterval: 15000,
  });

  const { data: tempData = [] } = useQuery({
    queryKey: ['dashboard-temp'],
    queryFn: () => api.getBlockTemperatures(),
    refetchInterval: 15000,
  });

  const ackMutation = useMutation({
    mutationFn: (id: string | number) => api.acknowledgeAlert(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dashboard-alerts'] }),
  });

  const resolveMutation = useMutation({
    mutationFn: (id: string | number) => api.resolveAlert(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dashboard-alerts'] }),
  });

  // Group classrooms by Block (A, B, C, D)
  const blocks = Array.from(new Set(classrooms.map((c) => c.building))).sort();
  const filteredClassrooms =
    selectedBlock === 'all'
      ? classrooms
      : classrooms.filter((c) => c.building === selectedBlock);

  const cameraClassroom = classrooms.find((c) => c.has_camera) || classrooms[0];

  return (
    <div className="space-y-5">
      {/* Top Header Strip */}
      <div className="border-ink bg-white p-4 shadow-neo flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="neo-header-strip inline-block">
              CENTRAL FACILITY COMMAND · TELEMETRY FUSION
            </span>
            <span className="text-[10px] font-mono text-neutral-500">
              TIMEZONE: Asia/Kolkata (IST)
            </span>
          </div>
          <h1 className="text-2xl font-black font-heading uppercase tracking-tight text-[#111111]">
            Campus Occupancy & Resource Operations
          </h1>
          <p className="text-xs text-neutral-600 font-mono">
            Multi-sensor evidence engine: Camera (YOLO11n) + HC-SR501 PIR + DHT11 + Schedule
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#2F9E44]/15 border-2 border-[#2F9E44] text-[#2F9E44] font-mono text-xs font-bold">
            <Radio size={14} className="animate-pulse" />
            <span>POLLING 3s</span>
          </div>
          <button
            onClick={() => queryClient.invalidateQueries()}
            className="neo-btn px-2.5 py-1 text-xs bg-white"
            title="Refresh All Telemetry"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* KPI 8-Cell Strip (§13, §21) */}
      {summary && <KpiStrip summary={summary} />}

      {/* Main Grid: Left 2/3 Classrooms by Block, Right 1/3 Attention + A101 Camera (§21) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left 2/3: Classroom Matrix Grouped by Block */}
        <div className="lg:col-span-2 space-y-4">
          <div className="neo-card p-4 bg-white space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-ink pb-2 gap-2">
              <div className="flex items-center gap-2">
                <Layers size={16} />
                <h2 className="font-heading font-black text-sm uppercase tracking-tight">
                  Classroom Node Matrix
                </h2>
                <span className="text-xs font-mono text-neutral-500">
                  ({filteredClassrooms.length} nodes)
                </span>
              </div>

              {/* Block Filter Controls */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setSelectedBlock('all')}
                  className={`px-2 py-0.5 text-[10px] font-mono font-bold border-2 ${
                    selectedBlock === 'all'
                      ? 'bg-[#111111] text-white border-ink'
                      : 'bg-[#F4F1EA] text-neutral-700 border-neutral-300 hover:border-ink'
                  }`}
                >
                  ALL BLOCKS
                </button>
                {blocks.map((blk) => (
                  <button
                    key={blk}
                    onClick={() => setSelectedBlock(blk)}
                    className={`px-2 py-0.5 text-[10px] font-mono font-bold border-2 ${
                      selectedBlock === blk
                        ? 'bg-[#111111] text-white border-ink'
                        : 'bg-[#F4F1EA] text-neutral-700 border-neutral-300 hover:border-ink'
                    }`}
                  >
                    {blk.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* State Color & Label Legend (§21) */}
            <div className="flex flex-wrap items-center gap-2 pt-1 pb-2 border-b border-neutral-200 text-[10px] font-mono">
              <span className="text-neutral-500 font-bold uppercase">STATE LEGEND:</span>
              {(
                [
                  'OCCUPIED',
                  'EMPTY',
                  'EXPECTED_OCCUPANCY',
                  'UNEXPECTED_OCCUPANCY',
                  'OCCUPANCY_ANOMALY',
                  'SENSOR_UNCERTAIN',
                ] as OccupancyState[]
              ).map((st) => {
                const s = OCCUPANCY_STATE_STYLES[st];
                return (
                  <span
                    key={st}
                    className={`px-1.5 py-0.5 border border-ink ${s.badgeBg} ${s.badgeText} font-bold`}
                  >
                    {s.label}
                  </span>
                );
              })}
            </div>

            {/* Room Plate Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
              {filteredClassrooms.map((room) => (
                <RoomPlate key={room.id} classroom={room} />
              ))}
            </div>
          </div>
        </div>

        {/* Right 1/3: Attention Required + Live Camera Panel A101 (§21) */}
        <div className="space-y-4">
          <AttentionPanel
            alerts={alerts}
            onAcknowledge={(id) => ackMutation.mutate(id)}
            onResolve={(id) => resolveMutation.mutate(id)}
          />

          {cameraClassroom && (
            <CameraPanel
              classroom={cameraClassroom}
              streamUrl={`http://localhost:8001/stream/${cameraClassroom.id}.mjpg`}
            />
          )}
        </div>
      </div>

      {/* Bottom Section: Diurnal Occupancy vs Expected + Avg Temp by Block (§21) */}
      <OccupancyCharts curveData={curveData} tempData={tempData} />
    </div>
  );
};
