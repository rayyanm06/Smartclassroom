import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { OCCUPANCY_STATE_STYLES, CONFIDENCE_BADGES } from '../lib/styles';
import { CameraPanel } from '../components/features/CameraPanel';
import {
  ArrowLeft,
  Activity,
  Thermometer,
  Zap,
  Users,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

export const ClassroomDetailPage: React.FC = () => {
  const { id = 'A101' } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: classroom, isLoading, error } = useQuery({
    queryKey: ['classroom-detail', id],
    queryFn: () => api.getClassroom(id),
    refetchInterval: 3000,
  });

  const applianceMutation = useMutation({
    mutationFn: (action: { device: 'ac' | 'light'; command: 'on' | 'off' }) =>
      api.dispatchApplianceAction(id, action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classroom-detail', id] });
    },
  });

  if (isLoading) {
    return (
      <div className="p-12 text-center font-mono text-xs">
        Loading classroom telemetry for {id}...
      </div>
    );
  }

  if (error || !classroom) {
    return (
      <div className="neo-card p-8 text-center space-y-4 max-w-md mx-auto bg-white">
        <AlertTriangle size={32} className="mx-auto text-[#D64545]" />
        <h2 className="font-heading font-black text-xl uppercase">Classroom Not Found</h2>
        <p className="text-xs font-mono text-neutral-600">
          No hardware telemetry registered for room {id}.
        </p>
        <Link to="/classrooms" className="neo-btn px-4 py-2 text-xs bg-[#111111] text-white">
          BACK TO DIRECTORY
        </Link>
      </div>
    );
  }

  const { state } = classroom;
  const stateStyle = OCCUPANCY_STATE_STYLES[state.occupancy_state];
  const confStyle = CONFIDENCE_BADGES[state.confidence_level];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/classrooms" className="neo-btn px-3 py-1.5 text-xs bg-white">
          <ArrowLeft size={14} /> BACK TO DIRECTORY
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-neutral-500">POLL: 3s</span>
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['classroom-detail', id] })}
            className="neo-btn p-1.5 text-xs bg-white"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Main Spec Header */}
      <div className="border-ink bg-white p-4 shadow-neo flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="neo-header-strip inline-block">
              CLASSROOM NODE TELEMETRY · UNIT SPEC
            </span>
            <span className="text-xs font-mono text-neutral-600 font-bold">
              {classroom.building} · Floor {classroom.floor} · {classroom.capacity} Seats
            </span>
          </div>
          <h1 className="text-3xl font-black font-mono tracking-tight text-[#111111]">
            {classroom.name} ({classroom.id})
          </h1>
          <p className="text-xs text-neutral-600 font-mono mt-0.5">
            Sensors: {classroom.has_camera ? 'YOLO Camera' : 'No Camera'} ·{' '}
            {classroom.has_pir ? 'HC-SR501 PIR' : 'No PIR'} ·{' '}
            {classroom.has_dht ? 'DHT11 Temp/Humidity' : 'No DHT'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <span
            className={`px-3 py-1 font-mono text-xs font-bold border-2 border-ink ${stateStyle.badgeBg} ${stateStyle.badgeText} shadow-neo-sm`}
          >
            STATE: {stateStyle.label}
          </span>
          <span
            className={`px-2.5 py-1 text-xs font-mono font-bold border ${confStyle.badge}`}
          >
            {confStyle.label}
          </span>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="neo-card p-3.5 bg-white">
          <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-500 mb-1">
            <Users size={14} /> DETECTED OCCUPANTS
          </div>
          <div className="font-mono text-2xl font-black">
            {classroom.has_camera && state.people_count !== null
              ? `${state.people_count} People`
              : '— (No camera)'}
          </div>
          <div className="text-[10px] text-neutral-500 font-mono mt-1">
            {classroom.has_camera ? 'YOLO11n confidence 94%' : 'Occupancy via PIR & Timetable'}
          </div>
        </div>

        <div className="neo-card p-3.5 bg-white">
          <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-500 mb-1">
            <Thermometer size={14} /> CLIMATE (DHT11)
          </div>
          <div className="font-mono text-2xl font-black">
            {state.temperature !== null ? `${state.temperature}°C` : 'OFFLINE'}
          </div>
          <div className="text-[10px] text-neutral-500 font-mono mt-1">
            Humidity: {state.humidity !== null ? `${state.humidity}% RH` : '—'}
          </div>
        </div>

        <div className="neo-card p-3.5 bg-white">
          <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-500 mb-1">
            <Activity size={14} /> PIR MOTION
          </div>
          <div
            className={`font-mono text-2xl font-black ${
              state.idle_minutes === 0 ? 'text-[#2F9E44]' : 'text-[#5F6368]'
            }`}
          >
            {state.idle_minutes === 0 ? 'ACTIVE' : `${state.idle_minutes}m IDLE`}
          </div>
          <div className="text-[10px] text-neutral-500 font-mono mt-1">
            HC-SR501 event stream
          </div>
        </div>

        <div className="neo-card p-3.5 bg-white">
          <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-500 mb-1">
            <Zap size={14} /> APPLIANCES
          </div>
          <div className="font-mono text-lg font-black">
            AC: <span className={state.ac_status ? 'text-[#2F9E44]' : 'text-neutral-400'}>{state.ac_status ? 'ON' : 'OFF'}</span> ·{' '}
            LT: <span className={state.light_status ? 'text-[#2F9E44]' : 'text-neutral-400'}>{state.light_status ? 'ON' : 'OFF'}</span>
          </div>
          <div className="text-[10px] text-neutral-500 font-mono mt-1">
            Rated: {classroom.ac_rated_kw + classroom.lights_rated_kw} kW
          </div>
        </div>
      </div>

      {/* Camera and Evidence Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {classroom.has_camera ? (
          <CameraPanel classroom={classroom} />
        ) : (
          <div className="neo-card p-6 bg-white flex flex-col justify-center items-center text-center space-y-3">
            <div className="w-12 h-12 bg-neutral-100 border-2 border-ink flex items-center justify-center">
              <Users size={24} className="text-neutral-500" />
            </div>
            <h3 className="font-heading font-black text-sm uppercase">NO CAMERA INSTALLED</h3>
            <p className="text-xs text-neutral-600 font-mono max-w-sm">
              Per Locked Decision <strong>D4</strong>, only classroom A101 utilizes optical surveillance.
              Occupancy in this room is derived strictly from PIR motion sensor and the timetable.
            </p>
          </div>
        )}

        {/* Evidence Trail & Appliance Control */}
        <div className="space-y-4">
          <div className="neo-card p-4 bg-white space-y-3">
            <h3 className="font-heading font-black text-sm uppercase border-b-2 border-ink pb-2">
              Sensor Fusion Evidence Trail
            </h3>
            <ul className="space-y-2 text-xs font-mono">
              {state.reasons.map((reason, idx) => (
                <li key={idx} className="p-2.5 bg-[#F4F1EA] border border-neutral-300">
                  {reason}
                </li>
              ))}
            </ul>
          </div>

          <div className="neo-card p-4 bg-white space-y-3">
            <h3 className="font-heading font-black text-sm uppercase border-b-2 border-ink pb-2">
              Remote Appliance Override (Command Queue)
            </h3>
            <p className="text-xs text-neutral-600 font-mono">
              Queues command in <code className="bg-neutral-100 px-1 border border-neutral-300">device_commands</code>.
              Device polls every 5s and executes before acknowledging.
            </p>
            <div className="flex flex-wrap gap-2.5 pt-1">
              <button
                onClick={() =>
                  applianceMutation.mutate({
                    device: 'ac',
                    command: state.ac_status ? 'off' : 'on',
                  })
                }
                className={`neo-btn px-3 py-1.5 text-xs ${
                  state.ac_status ? 'bg-[#D64545] text-white' : 'bg-[#2F9E44] text-white'
                }`}
              >
                TURN {state.ac_status ? 'OFF' : 'ON'} AC
              </button>
              <button
                onClick={() =>
                  applianceMutation.mutate({
                    device: 'light',
                    command: state.light_status ? 'off' : 'on',
                  })
                }
                className={`neo-btn px-3 py-1.5 text-xs ${
                  state.light_status ? 'bg-[#111111] text-white' : 'bg-[#2F9E44] text-white'
                }`}
              >
                TURN {state.light_status ? 'OFF' : 'ON'} LIGHTS
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
