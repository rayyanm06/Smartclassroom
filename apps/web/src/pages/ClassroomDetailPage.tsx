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
  Users,
  AlertTriangle,
  RefreshCw,
  Radio,
  Calendar,
  Info,
} from 'lucide-react';

export const ClassroomDetailPage: React.FC = () => {
  const { id = 'A101' } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: classroom, isLoading, error } = useQuery({
    queryKey: ['classroom-detail', id],
    queryFn: () => api.getClassroom(id),
    refetchInterval: 3000,
  });

  const { data: simStatus } = useQuery({
    queryKey: ['simulation-status'],
    queryFn: () => api.getSimulationStatus(),
    refetchInterval: 3000,
  });

  const { data: simRoom } = useQuery({
    queryKey: ['simulated-classroom', id],
    queryFn: () => api.getSimulatedClassroom(id),
    refetchInterval: 3000,
  });

  const isSimulationMode = simStatus?.simulation_enabled ?? true;

  const simMutation = useMutation({
    mutationFn: (action: { device: 'ac' | 'light'; command: 'on' | 'off' }) =>
      api.dispatchSimulatedAction(id, action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simulated-classroom', id] });
      queryClient.invalidateQueries({ queryKey: ['simulation-status'] });
      queryClient.invalidateQueries({ queryKey: ['classroom-detail', id] });
    },
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
  const stateStyle = OCCUPANCY_STATE_STYLES[state.occupancy_state] || OCCUPANCY_STATE_STYLES.UNKNOWN;
  const confStyle = CONFIDENCE_BADGES[state.confidence_level] || CONFIDENCE_BADGES.low;

  const currentEntry = classroom.current_entry;
  const nextEntry = classroom.next_entry;
  const openAlerts = classroom.open_alerts || [];
  const recentCommands = classroom.recent_commands || [];

  const acSimOn = simRoom?.ac_simulated ?? false;
  const ltSimOn = simRoom?.light_simulated ?? false;

  return (
    <div className="space-y-6">
      {/* Simulation Mode Persistent Banner */}
      {isSimulationMode && (
        <div className="p-3 bg-[#FFF9DB] border-2 border-ink text-[#8C5E1E] text-xs font-mono shadow-neo-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info size={16} />
            <span>
              <strong>SIMULATION MODE:</strong> AC and lights are virtual. No physical appliances are controlled.
            </span>
          </div>
          <Link to="/watchman" className="underline font-bold">
            SWITCH MODE IN WATCHMAN
          </Link>
        </div>
      )}

      <div className="flex items-center justify-between">
        <Link to="/classrooms" className="neo-btn px-3 py-1.5 text-xs bg-white flex items-center gap-1.5">
          <ArrowLeft size={14} /> BACK TO DIRECTORY
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-neutral-500">LIVE SYNC: 3s</span>
          <button
            onClick={() => queryClient.invalidateQueries()}
            className="neo-btn p-1.5 text-xs bg-white"
            title="Refresh Telemetry"
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
            {classroom.has_pir ? 'HC-SR501 PIR Motion' : 'No PIR'} ·{' '}
            {classroom.has_dht ? 'DHT11 Temp/Humidity' : 'No DHT'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <span
            className={`px-3 py-1 font-mono text-xs font-bold border-2 border-ink ${stateStyle.badgeBg} ${stateStyle.badgeText} shadow-neo-sm`}
          >
            OCCUPANCY: {stateStyle.label}
          </span>
          <span
            className={`px-2.5 py-1 text-xs font-mono font-bold border ${confStyle.badge}`}
          >
            {confStyle.label}
          </span>
        </div>
      </div>

      {/* Active Alerts Strip if camera/sensor offline or energy anomaly */}
      {openAlerts.length > 0 && (
        <div className="space-y-2">
          {openAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-3 border-2 border-ink shadow-neo-sm flex items-start gap-3 ${
                alert.severity === 'critical'
                  ? 'bg-[#FFEBEB] text-[#D64545]'
                  : 'bg-[#FFF9DB] text-[#B07236]'
              }`}
            >
              <AlertTriangle size={18} className="shrink-0 mt-0.5" />
              <div className="flex-1 font-mono text-xs">
                <div className="font-bold uppercase tracking-wide">{alert.headline}</div>
                <div className="text-neutral-700 mt-0.5">{alert.detail}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Metric Cards Grid - Independent, Simultaneous Sensors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Camera & People Count */}
        <div className="neo-card p-3.5 bg-white space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-neutral-500">
            <span className="flex items-center gap-1.5">
              <Users size={14} /> CAMERA DETECTION
            </span>
            <span
              className={`text-[10px] font-mono px-1.5 py-0.2 border ${
                classroom.has_camera
                  ? state.camera_online
                    ? 'bg-[#EBFBEE] text-[#2F9E44] border-[#2F9E44]'
                    : 'bg-[#FFEBEB] text-[#D64545] border-[#D64545]'
                  : 'bg-neutral-100 text-neutral-500 border-neutral-300'
              }`}
            >
              {classroom.has_camera ? (state.camera_online ? 'ONLINE' : 'OFFLINE') : 'NOT INSTALLED'}
            </span>
          </div>
          <div className="font-mono text-2xl font-black">
            {classroom.has_camera
              ? state.camera_online && state.people_count !== null
                ? `${state.people_count} People`
                : 'UNAVAILABLE'
              : '— (No camera)'}
          </div>
          <div className="text-[10px] text-neutral-500 font-mono">
            {classroom.has_camera
              ? state.camera_online
                ? 'YOLO11n computer vision active'
                : 'Camera feed timed out. Count unverified.'
              : 'Occupancy relies on schedule & PIR.'}
          </div>
        </div>

        {/* Card 2: PIR Motion Sensor */}
        <div className="neo-card p-3.5 bg-white space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-neutral-500">
            <span className="flex items-center gap-1.5">
              <Activity size={14} /> PIR MOTION SENSOR
            </span>
            <span
              className={`text-[10px] font-mono px-1.5 py-0.2 border ${
                classroom.has_pir
                  ? state.sensor_online
                    ? 'bg-[#EBFBEE] text-[#2F9E44] border-[#2F9E44]'
                    : 'bg-[#FFEBEB] text-[#D64545] border-[#D64545]'
                  : 'bg-neutral-100 text-neutral-500 border-neutral-300'
              }`}
            >
              {classroom.has_pir ? (state.sensor_online ? 'ONLINE' : 'OFFLINE') : 'NOT INSTALLED'}
            </span>
          </div>
          <div
            className={`font-mono text-xl font-black ${
              state.idle_minutes === 0 ? 'text-[#2F9E44]' : 'text-neutral-700'
            }`}
          >
            {state.idle_minutes === 0 ? 'MOVEMENT DETECTED' : 'NO RECENT MOVEMENT'}
          </div>
          <div className="text-[10px] text-neutral-500 font-mono">
            {state.idle_minutes === 0
              ? 'Active physical movement detected'
              : `${state.idle_minutes} min since last physical movement`}
          </div>
        </div>

        {/* Card 3: Climate (DHT11) */}
        <div className="neo-card p-3.5 bg-white space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-neutral-500">
            <span className="flex items-center gap-1.5">
              <Thermometer size={14} /> CLIMATE (DHT11)
            </span>
            <span
              className={`text-[10px] font-mono px-1.5 py-0.2 border ${
                classroom.has_dht
                  ? state.sensor_online
                    ? 'bg-[#EBFBEE] text-[#2F9E44] border-[#2F9E44]'
                    : 'bg-[#FFEBEB] text-[#D64545] border-[#D64545]'
                  : 'bg-neutral-100 text-neutral-500 border-neutral-300'
              }`}
            >
              {classroom.has_dht ? (state.sensor_online ? 'ONLINE' : 'OFFLINE') : 'NOT INSTALLED'}
            </span>
          </div>
          <div className="font-mono text-2xl font-black">
            {state.temperature !== null ? `${state.temperature}°C` : 'OFFLINE'}
          </div>
          <div className="text-[10px] text-neutral-500 font-mono">
            Humidity: {state.humidity !== null ? `${state.humidity}% RH` : '—'} · Live ESP32 stream
          </div>
        </div>

        {/* Card 4: Occupancy Assessment */}
        <div className="neo-card p-3.5 bg-white space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-neutral-500">
            <span className="flex items-center gap-1.5">
              <Radio size={14} /> OCCUPANCY STATUS
            </span>
            <span className={`text-[10px] font-mono px-1.5 py-0.2 border ${confStyle.badge}`}>
              {confStyle.label}
            </span>
          </div>
          <div className={`font-mono text-2xl font-black ${stateStyle.text}`}>
            {state.occupancy_state}
          </div>
          <div className="text-[10px] text-neutral-600 font-mono">
            {state.occupancy_state === 'OCCUPIED' && 'Confirmed by visual detection.'}
            {state.occupancy_state === 'EMPTY' && 'Camera confirms 0 occupants.'}
            {state.occupancy_state === 'UNKNOWN' && 'Camera unavailable. Visual confirmation required.'}
            {state.occupancy_state === 'EXPECTED_OCCUPANCY' && 'Scheduled class in session; awaiting check.'}
            {state.occupancy_state === 'UNEXPECTED_OCCUPANCY' && 'Motion detected outside scheduled class hours.'}
            {state.occupancy_state === 'SENSOR_UNCERTAIN' && 'Sensors reporting ambiguous signals.'}
          </div>
        </div>
      </div>

      {/* Timetable Schedule Preview */}
      <div className="neo-card p-4 bg-white space-y-3">
        <div className="flex items-center justify-between border-b-2 border-ink pb-2">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-neutral-700" />
            <h3 className="font-heading font-black text-sm uppercase">Timetable Schedule Preview</h3>
          </div>
          <span className="font-mono text-xs text-neutral-500">Local Time (Asia/Kolkata)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
          {/* Current Class */}
          <div className="p-3 border border-neutral-300 bg-[#F4F1EA]">
            <div className="text-[10px] uppercase font-bold text-neutral-500 mb-1">CURRENT SESSION</div>
            {currentEntry ? (
              <div className="space-y-1">
                <div className="font-bold text-sm text-[#111111]">{currentEntry.subject}</div>
                <div className="text-neutral-600">Faculty: {currentEntry.faculty}</div>
                <div className="text-neutral-600">
                  Time: {currentEntry.start_time} - {currentEntry.end_time} ({currentEntry.class_type})
                </div>
                <div className="text-[#2F9E44] font-bold text-[11px] mt-1">
                  Expected State: AC ON · LIGHTS ON
                </div>
              </div>
            ) : (
              <div className="text-neutral-500 py-2">
                No scheduled class is currently in session for this room.
              </div>
            )}
          </div>

          {/* Next Class */}
          <div className="p-3 border border-neutral-300 bg-white">
            <div className="text-[10px] uppercase font-bold text-neutral-500 mb-1">UPCOMING SESSION</div>
            {nextEntry ? (
              <div className="space-y-1">
                <div className="font-bold text-sm text-[#111111]">{nextEntry.subject}</div>
                <div className="text-neutral-600">Faculty: {nextEntry.faculty}</div>
                <div className="text-neutral-600">
                  Starts: {nextEntry.start_time} - {nextEntry.end_time} ({nextEntry.class_type})
                </div>
                <div className="text-neutral-700 font-bold text-[11px] mt-1">
                  Expected State: AC ON · LIGHTS ON at start time
                </div>
              </div>
            ) : (
              <div className="text-neutral-500 py-2">
                No further classes scheduled for today.
              </div>
            )}
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
              Optical computer vision is deployed on designated pilot classrooms (e.g. 508 / 002).
              Occupancy in this room is derived strictly from PIR motion sensor and the timetable.
            </p>
          </div>
        )}

        {/* Evidence Trail & Appliance Control */}
        <div className="space-y-4">
          <div className="neo-card p-4 bg-white space-y-3">
            <h3 className="font-heading font-black text-sm uppercase border-b-2 border-ink pb-2">
              Combined Sensor & Camera Evidence Trail
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
            <div className="flex items-center justify-between border-b-2 border-ink pb-2">
              <h3 className="font-heading font-black text-sm uppercase">
                {isSimulationMode ? 'Virtual Appliance Controls (Simulation)' : 'Remote Appliance Override (Queue)'}
              </h3>
              <span className="font-mono text-[10px] text-neutral-500">
                {isSimulationMode ? 'INTERACTIVE SIMULATION' : 'COMMAND QUEUE'}
              </span>
            </div>

            {/* Hardware Disclosure Notice */}
            <div
              className={`p-2.5 border text-[11px] font-mono flex items-start gap-2 ${
                isSimulationMode
                  ? 'bg-amber-50 border-amber-300 text-amber-900'
                  : 'bg-neutral-100 border-neutral-300 text-neutral-800'
              }`}
            >
              <Info size={15} className="shrink-0 mt-0.5 text-amber-700" />
              <div>
                {isSimulationMode ? (
                  <>
                    <strong>Simulation Mode Active:</strong> Clicking these controls immediately toggles virtual AC and lighting state in software. Estimated energy consumption and savings are calculated without modifying physical hardware.
                  </>
                ) : (
                  <>
                    <strong>Hardware Notice:</strong> The active ESP32 node runs sensor telemetry and a status LED. High-voltage AC compressor and lighting relays are not physically wired; override commands remain queued in software until contactor relays are attached.
                  </>
                )}
              </div>
            </div>

            {/* Room Estimated Energy Numbers */}
            {isSimulationMode && simRoom && (
              <div className="grid grid-cols-3 gap-2 text-xs font-mono p-2 bg-[#F4F1EA] border border-neutral-300">
                <div>
                  <span className="text-[10px] text-neutral-500 block uppercase">EST. CONSUMED</span>
                  <strong className="text-sm">{simRoom.energy_consumed_kwh} kWh</strong>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-500 block uppercase">EST. SAVED</span>
                  <strong className="text-sm text-[#2F9E44]">{simRoom.energy_saved_kwh} kWh</strong>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-500 block uppercase">EST. WASTED</span>
                  <strong className="text-sm text-[#D64545]">{simRoom.energy_wasted_kwh} kWh</strong>
                </div>
              </div>
            )}

            {/* Interactive Control Buttons */}
            {isSimulationMode ? (
              <div className="flex flex-wrap gap-2.5 pt-1">
                <button
                  disabled={simMutation.isPending}
                  onClick={() => simMutation.mutate({ device: 'ac', command: 'on' })}
                  className={`neo-btn px-3 py-2 text-xs font-bold ${
                    acSimOn ? 'bg-neutral-200 text-neutral-500 border-neutral-400' : 'bg-[#2F9E44] text-white'
                  }`}
                >
                  TURN AC ON
                </button>
                <button
                  disabled={simMutation.isPending}
                  onClick={() => simMutation.mutate({ device: 'ac', command: 'off' })}
                  className={`neo-btn px-3 py-2 text-xs font-bold ${
                    !acSimOn ? 'bg-neutral-200 text-neutral-500 border-neutral-400' : 'bg-[#D64545] text-white'
                  }`}
                >
                  TURN AC OFF
                </button>
                <button
                  disabled={simMutation.isPending}
                  onClick={() => simMutation.mutate({ device: 'light', command: 'on' })}
                  className={`neo-btn px-3 py-2 text-xs font-bold ${
                    ltSimOn ? 'bg-neutral-200 text-neutral-500 border-neutral-400' : 'bg-[#2F9E44] text-white'
                  }`}
                >
                  TURN LIGHTS ON
                </button>
                <button
                  disabled={simMutation.isPending}
                  onClick={() => simMutation.mutate({ device: 'light', command: 'off' })}
                  className={`neo-btn px-3 py-2 text-xs font-bold ${
                    !ltSimOn ? 'bg-neutral-200 text-neutral-500 border-neutral-400' : 'bg-[#111111] text-white'
                  }`}
                >
                  TURN LIGHTS OFF
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2.5 pt-1">
                <button
                  disabled={applianceMutation.isPending}
                  onClick={() => applianceMutation.mutate({ device: 'ac', command: 'on' })}
                  className="neo-btn px-3 py-2 text-xs bg-[#2F9E44] text-white font-bold"
                >
                  QUEUE AC ON
                </button>
                <button
                  disabled={applianceMutation.isPending}
                  onClick={() => applianceMutation.mutate({ device: 'ac', command: 'off' })}
                  className="neo-btn px-3 py-2 text-xs bg-[#D64545] text-white font-bold"
                >
                  QUEUE AC OFF
                </button>
                <button
                  disabled={applianceMutation.isPending}
                  onClick={() => applianceMutation.mutate({ device: 'light', command: 'on' })}
                  className="neo-btn px-3 py-2 text-xs bg-[#2F9E44] text-white font-bold"
                >
                  QUEUE LIGHTS ON
                </button>
                <button
                  disabled={applianceMutation.isPending}
                  onClick={() => applianceMutation.mutate({ device: 'light', command: 'off' })}
                  className="neo-btn px-3 py-2 text-xs bg-[#111111] text-white font-bold"
                >
                  QUEUE LIGHTS OFF
                </button>
              </div>
            )}

            {(simMutation.isPending || applianceMutation.isPending) && (
              <div className="text-xs font-mono text-neutral-500 animate-pulse">
                Processing command request...
              </div>
            )}

            {/* Recent Simulated / Hardware Commands Table */}
            {isSimulationMode && simRoom && simRoom.recent_commands && simRoom.recent_commands.length > 0 && (
              <div className="pt-2 border-t border-neutral-200">
                <div className="text-[10px] font-mono font-bold uppercase text-neutral-500 mb-1.5">
                  Recent Simulated Appliance Commands:
                </div>
                <div className="space-y-1.5 font-mono text-[11px]">
                  {simRoom.recent_commands.map((cmd) => (
                    <div
                      key={cmd.id}
                      className="p-1.5 bg-[#F4F1EA] border border-neutral-300 flex items-center justify-between"
                    >
                      <span>
                        <strong className="uppercase">{cmd.device}</strong> &rarr; {cmd.command.toUpperCase()}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.2 border text-[10px] bg-[#EBFBEE] text-[#2F9E44] border-[#2F9E44]">
                          COMPLETED
                        </span>
                        <span className="text-neutral-500 text-[10px]">
                          {new Date(cmd.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!isSimulationMode && recentCommands.length > 0 && (
              <div className="pt-2 border-t border-neutral-200">
                <div className="text-[10px] font-mono font-bold uppercase text-neutral-500 mb-1.5">
                  Recent Queued Hardware Commands:
                </div>
                <div className="space-y-1.5 font-mono text-[11px]">
                  {recentCommands.map((cmd) => (
                    <div
                      key={cmd.id}
                      className="p-1.5 bg-[#F4F1EA] border border-neutral-300 flex items-center justify-between"
                    >
                      <span>
                        <strong className="uppercase">{cmd.device}</strong> &rarr; {cmd.command.toUpperCase()}
                      </span>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-1.5 py-0.2 border text-[10px] ${
                            cmd.status === 'acked'
                              ? 'bg-[#EBFBEE] text-[#2F9E44] border-[#2F9E44]'
                              : 'bg-amber-100 text-amber-800 border-amber-300'
                          }`}
                        >
                          {cmd.status === 'pending' ? 'WAITING FOR NODE' : 'ACKNOWLEDGED'}
                        </span>
                        <span className="text-neutral-500 text-[10px]">
                          {new Date(cmd.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

