import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { OCCUPANCY_STATE_STYLES } from '../lib/styles';
import {
  CheckCircle2,
  Clock,
  RefreshCw,
  AlertTriangle,
  Calendar,
  ExternalLink,
  Search,
  Sliders,
  RotateCcw,
  Check,
  Info,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const WatchmanPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<
    'all' | 'occupied' | 'empty' | 'unknown' | 'waste' | 'camera_offline' | 'sensor_offline'
  >('all');
  const [actionFeedback, setActionFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Live queries with 3s refetch
  const { data: summary } = useQuery({
    queryKey: ['watchman-summary'],
    queryFn: () => api.getSummary(),
    refetchInterval: 3000,
  });

  const { data: classrooms = [] } = useQuery({
    queryKey: ['watchman-classrooms'],
    queryFn: () => api.getClassrooms(),
    refetchInterval: 3000,
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ['watchman-alerts'],
    queryFn: () => api.getAlerts({ status: 'open' }),
    refetchInterval: 3000,
  });

  const { data: timetable = [] } = useQuery({
    queryKey: ['watchman-timetable'],
    queryFn: () => api.getTimetable(),
    refetchInterval: 10000,
  });

  const { data: simStatus } = useQuery({
    queryKey: ['simulation-status'],
    queryFn: () => api.getSimulationStatus(),
    refetchInterval: 3000,
  });

  const { data: simRooms = {} } = useQuery({
    queryKey: ['simulated-classrooms'],
    queryFn: () => api.getSimulatedClassrooms(),
    refetchInterval: 3000,
  });

  const isSimulationMode = simStatus?.simulation_enabled ?? true;

  // Mutations
  const modeMutation = useMutation({
    mutationFn: (enabled: boolean) => api.setSimulationMode(enabled),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['simulation-status'] });
      queryClient.invalidateQueries({ queryKey: ['watchman-summary'] });
      setActionFeedback({
        message: data.simulation_enabled ? 'Switched to Simulation Mode.' : 'Switched to Hardware Mode.',
        type: 'success',
      });
      setTimeout(() => setActionFeedback(null), 4000);
    },
  });

  const simActionMutation = useMutation({
    mutationFn: ({ classroomId, action }: { classroomId: string; action: { device: 'ac' | 'light'; command: 'on' | 'off' } }) =>
      api.dispatchSimulatedAction(classroomId, action),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['simulated-classrooms'] });
      queryClient.invalidateQueries({ queryKey: ['simulation-status'] });
      queryClient.invalidateQueries({ queryKey: ['watchman-summary'] });
      setActionFeedback({
        message: `Room ${variables.classroomId}: Virtual ${variables.action.device.toUpperCase()} turned ${variables.action.command.toUpperCase()}.`,
        type: 'success',
      });
      setTimeout(() => setActionFeedback(null), 4000);
    },
    onError: (err: any) => {
      setActionFeedback({
        message: `Action failed: ${err.message || 'Request error'}`,
        type: 'error',
      });
      setTimeout(() => setActionFeedback(null), 5000);
    },
  });

  const resetMutation = useMutation({
    mutationFn: () => api.resetSimulation(),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['simulated-classrooms'] });
      queryClient.invalidateQueries({ queryKey: ['simulation-status'] });
      queryClient.invalidateQueries({ queryKey: ['watchman-summary'] });
      setActionFeedback({
        message: data.message,
        type: 'success',
      });
      setTimeout(() => setActionFeedback(null), 5000);
    },
  });

  const ackMutation = useMutation({
    mutationFn: (alertId: string | number) => api.acknowledgeAlert(alertId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchman-alerts'] });
    },
  });

  // Current local time in Asia/Kolkata
  const now = new Date();
  const currentTimeString = now.toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  const jsDay = now.getDay();
  const pyDay = jsDay === 0 ? 6 : jsDay - 1;
  const todaySchedule = timetable
    .filter((t) => t.day_of_week === pyDay)
    .sort((a, b) => a.start_time.localeCompare(b.start_time));

  // Filtered rooms logic
  const filteredClassrooms = classrooms.filter((room) => {
    const matchesSearch =
      room.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    const state = room.state;
    const sim = simRooms[room.id];
    const acOn = isSimulationMode ? sim?.ac_simulated : state.ac_status;
    const ltOn = isSimulationMode ? sim?.light_simulated : state.light_status;

    if (selectedFilter === 'occupied') return state.occupancy_state === 'OCCUPIED';
    if (selectedFilter === 'empty') return state.occupancy_state === 'EMPTY';
    if (selectedFilter === 'unknown') return state.occupancy_state === 'UNKNOWN' || state.occupancy_state === 'SENSOR_UNCERTAIN';
    if (selectedFilter === 'waste') {
      return state.occupancy_state === 'EMPTY' && (acOn || ltOn);
    }
    if (selectedFilter === 'camera_offline') return room.has_camera && !state.camera_online;
    if (selectedFilter === 'sensor_offline') return (room.has_pir || room.has_dht) && !state.sensor_online;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#F4F1EA] text-[#111111] p-3 sm:p-6 max-w-6xl mx-auto space-y-5">
      {/* Operating Mode Persistent Banner */}
      <div
        className={`p-3 border-2 border-ink shadow-neo flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          isSimulationMode
            ? 'bg-[#FFF9DB] text-[#8C5E1E]'
            : 'bg-[#EBFBEE] text-[#1E7E34]'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <Sliders size={18} className="shrink-0" />
          <div className="font-mono text-xs">
            <strong>{isSimulationMode ? 'SIMULATION MODE' : 'HARDWARE MODE'}:</strong>{' '}
            {isSimulationMode
              ? 'AC and lights are virtual software controllers. No physical appliances are controlled.'
              : 'Displaying verified physical node telemetry. Physical relays are not connected.'}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => modeMutation.mutate(!isSimulationMode)}
            className="neo-btn px-2.5 py-1 text-xs bg-white text-[#111111] font-bold"
          >
            SWITCH TO {isSimulationMode ? 'HARDWARE MODE' : 'SIMULATION MODE'}
          </button>
          {isSimulationMode && (
            <button
              onClick={() => {
                if (window.confirm('Reset all virtual appliances to OFF and clear simulated energy counters?')) {
                  resetMutation.mutate();
                }
              }}
              className="neo-btn px-2 py-1 text-xs bg-white text-[#D64545] font-bold flex items-center gap-1"
              title="Reset Simulation State"
            >
              <RotateCcw size={12} /> RESET SIM
            </button>
          )}
        </div>
      </div>

      {/* Action Feedback Banner */}
      {actionFeedback && (
        <div
          className={`p-2.5 border-2 border-ink text-xs font-mono font-bold shadow-neo-sm flex items-center gap-2 ${
            actionFeedback.type === 'success'
              ? 'bg-[#EBFBEE] text-[#2F9E44]'
              : 'bg-[#FFEBEB] text-[#D64545]'
          }`}
        >
          {actionFeedback.type === 'success' ? <Check size={16} /> : <AlertTriangle size={16} />}
          <span>{actionFeedback.message}</span>
        </div>
      )}

      {/* Top Header */}
      <header className="border-b-2 border-ink pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 bg-[#2F9E44] rounded-full animate-pulse" />
            <span className="font-mono text-xs font-bold tracking-wider text-neutral-600 uppercase">
              CAMPUS WATCHMAN TERMINAL · ENERGY CONSERVATION
            </span>
          </div>
          <h1 className="font-heading font-black text-2xl uppercase tracking-tight">
            Energy Conservation & Room Monitor
          </h1>
          <p className="font-mono text-xs text-neutral-600">
            Real-time room occupancy, appliance power status, and simulated energy reduction
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="font-mono text-xs border border-ink bg-white px-3 py-1.5 shadow-neo-sm font-bold flex items-center gap-1.5">
            <Clock size={14} className="text-neutral-500" />
            <span>{currentTimeString} (IST)</span>
          </div>
          <button
            onClick={() => {
              queryClient.invalidateQueries();
            }}
            className="p-2 border-2 border-ink bg-white shadow-neo-sm hover:translate-y-0.5 transition-transform"
            title="Refresh All Feeds"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </header>

      {/* Top Summary Cards (Section 2.1) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
        <div className="border-2 border-ink bg-white p-2.5 shadow-neo-sm">
          <div className="text-[10px] font-mono font-bold text-neutral-500 uppercase">TOTAL ROOMS</div>
          <div className="font-mono text-2xl font-black">{summary?.total_classrooms ?? classrooms.length}</div>
          <div className="text-[9px] text-neutral-500 font-mono">Managed nodes</div>
        </div>

        <div className="border-2 border-ink bg-white p-2.5 shadow-neo-sm">
          <div className="text-[10px] font-mono font-bold text-[#2F9E44] uppercase">OCCUPIED</div>
          <div className="font-mono text-2xl font-black text-[#2F9E44]">{summary?.occupied_now ?? 0}</div>
          <div className="text-[9px] text-neutral-500 font-mono">Camera verified</div>
        </div>

        <div className="border-2 border-ink bg-white p-2.5 shadow-neo-sm">
          <div className="text-[10px] font-mono font-bold text-neutral-700 uppercase">EMPTY</div>
          <div className="font-mono text-2xl font-black text-neutral-700">{summary?.empty_now ?? 0}</div>
          <div className="text-[9px] text-neutral-500 font-mono">Camera 0 count</div>
        </div>

        <div className="border-2 border-ink bg-white p-2.5 shadow-neo-sm">
          <div className="text-[10px] font-mono font-bold text-[#B07236] uppercase">UNKNOWN</div>
          <div className="font-mono text-2xl font-black text-[#B07236]">
            {summary?.unknown_now ?? summary?.sensor_uncertain ?? 0}
          </div>
          <div className="text-[9px] text-neutral-500 font-mono">Unverified vision</div>
        </div>

        <div className="border-2 border-ink bg-white p-2.5 shadow-neo-sm">
          <div className="text-[10px] font-mono font-bold text-[#D64545] uppercase">CAM OFFLINE</div>
          <div className="font-mono text-2xl font-black text-[#D64545]">{summary?.cameras_offline ?? 0}</div>
          <div className="text-[9px] text-neutral-500 font-mono">Stream down</div>
        </div>

        <div className="border-2 border-ink bg-white p-2.5 shadow-neo-sm">
          <div className="text-[10px] font-mono font-bold text-neutral-600 uppercase">SENS OFFLINE</div>
          <div className="font-mono text-2xl font-black text-neutral-700">{summary?.sensors_offline ?? 0}</div>
          <div className="text-[9px] text-neutral-500 font-mono">IoT sensor nodes</div>
        </div>

        <div className="border-2 border-ink bg-white p-2.5 shadow-neo-sm">
          <div className="text-[10px] font-mono font-bold text-amber-700 uppercase">POSSIBLE WASTE</div>
          <div className="font-mono text-2xl font-black text-amber-700">
            {summary?.possible_energy_waste_rooms ?? (simStatus?.rooms_with_waste.length ?? 0)}
          </div>
          <div className="text-[9px] text-neutral-500 font-mono">Empty + ON</div>
        </div>

        <div className="border-2 border-ink bg-white p-2.5 shadow-neo-sm">
          <div className="text-[10px] font-mono font-bold text-[#111111] uppercase">
            {isSimulationMode ? 'SIM ON' : 'ACTIVE ALERTS'}
          </div>
          <div className="font-mono text-2xl font-black text-[#111111]">
            {isSimulationMode ? (simStatus?.total_simulated_appliances_on ?? 0) : alerts.length}
          </div>
          <div className="text-[9px] text-neutral-500 font-mono">
            {isSimulationMode ? 'Virtual appliances' : 'Open anomalies'}
          </div>
        </div>
      </div>

      {/* Energy Estimates Banner (Section 4) */}
      {isSimulationMode && simStatus && (
        <div className="p-3 bg-white border-2 border-ink shadow-neo-sm flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-neutral-500 block text-[10px] uppercase font-bold">ESTIMATED ENERGY USED</span>
              <strong className="text-base text-[#111111]">{simStatus.total_energy_consumed_kwh} kWh</strong>
            </div>
            <div className="border-l border-neutral-300 pl-4">
              <span className="text-neutral-500 block text-[10px] uppercase font-bold">ESTIMATED SAVINGS</span>
              <strong className="text-base text-[#2F9E44]">{simStatus.total_energy_saved_kwh} kWh</strong>
            </div>
            <div className="border-l border-neutral-300 pl-4">
              <span className="text-neutral-500 block text-[10px] uppercase font-bold">ESTIMATED WASTE IN EMPTY ROOMS</span>
              <strong className="text-base text-[#D64545]">{simStatus.total_energy_wasted_kwh} kWh</strong>
            </div>
          </div>
          <div className="text-[10px] text-neutral-500 max-w-sm">
            Note: Energy values are estimates based on configured simulation assumptions, not readings from a physical electricity meter.
          </div>
        </div>
      )}

      {/* Primary Room Grid Header & Filters (Section 2.2) */}
      <div className="space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white border-2 border-ink p-3 shadow-neo-sm">
          {/* Room Search */}
          <div className="flex items-center gap-2 flex-1 max-w-sm">
            <Search size={16} className="text-neutral-500" />
            <input
              type="text"
              placeholder="Search room by number or name (e.g. 508)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs font-mono p-1.5 bg-[#F4F1EA] border border-neutral-300 focus:outline-none focus:border-ink"
            />
          </div>

          {/* Quick Filter Chips */}
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono">
            {[
              { id: 'all', label: 'All Rooms' },
              { id: 'occupied', label: 'Occupied' },
              { id: 'empty', label: 'Empty' },
              { id: 'unknown', label: 'Unknown' },
              { id: 'waste', label: 'Possible Waste' },
              { id: 'camera_offline', label: 'Camera Offline' },
              { id: 'sensor_offline', label: 'Sensor Offline' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setSelectedFilter(f.id as any)}
                className={`px-2 py-1 font-bold border ${
                  selectedFilter === f.id
                    ? 'bg-[#111111] text-white border-ink'
                    : 'bg-[#F4F1EA] text-neutral-700 border-neutral-300 hover:border-ink'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Primary Room Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredClassrooms.map((room) => {
            const state = room.state;
            const sim = simRooms[room.id];
            const stateStyle = OCCUPANCY_STATE_STYLES[state.occupancy_state] || OCCUPANCY_STATE_STYLES.UNKNOWN;

            // Appliance state depending on active mode
            const acSimOn = sim?.ac_simulated ?? false;
            const ltSimOn = sim?.light_simulated ?? false;

            const isConfirmedEmpty = state.occupancy_state === 'EMPTY';
            const isUnknownOccupancy = state.occupancy_state === 'UNKNOWN';
            const hasPossibleWaste = isConfirmedEmpty && (isSimulationMode ? (acSimOn || ltSimOn) : (state.ac_status || state.light_status));

            return (
              <div
                key={room.id}
                className={`border-2 border-ink bg-white p-3.5 shadow-neo space-y-3 ${
                  hasPossibleWaste ? 'border-amber-500' : ''
                }`}
              >
                {/* Room Header */}
                <div className="flex items-start justify-between border-b border-neutral-200 pb-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xl font-black text-[#111111]">{room.id}</span>
                      <span className="text-[10px] font-mono text-neutral-500">· {room.name}</span>
                    </div>
                    <span className="text-[10px] font-mono text-neutral-500">
                      Floor {room.floor} · {room.capacity} Seats
                    </span>
                  </div>

                  <span
                    className={`px-2 py-0.5 font-mono text-[10px] font-bold border ${stateStyle.badgeBg} ${stateStyle.badgeText} border-ink`}
                  >
                    {state.occupancy_state}
                  </span>
                </div>

                {/* Sensor & Telemetry Metrics */}
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  {/* People Count */}
                  <div className="p-2 bg-[#F4F1EA] border border-neutral-300">
                    <span className="text-[9px] text-neutral-500 font-bold block uppercase">OCCUPANTS</span>
                    <strong className="text-sm">
                      {room.has_camera
                        ? state.camera_online && state.people_count !== null
                          ? `${state.people_count} pers.`
                          : 'UNAVAILABLE'
                        : 'No Camera'}
                    </strong>
                  </div>

                  {/* Climate */}
                  <div className="p-2 bg-[#F4F1EA] border border-neutral-300">
                    <span className="text-[9px] text-neutral-500 font-bold block uppercase">CLIMATE (DHT11)</span>
                    <strong className="text-sm">
                      {state.temperature !== null ? `${state.temperature}°C` : 'OFFLINE'}
                      {state.humidity !== null && ` · ${state.humidity}%`}
                    </strong>
                  </div>

                  {/* PIR Movement */}
                  <div className="p-2 bg-[#F4F1EA] border border-neutral-300">
                    <span className="text-[9px] text-neutral-500 font-bold block uppercase">PIR MOVEMENT</span>
                    <strong className={state.idle_minutes === 0 ? 'text-[#2F9E44]' : 'text-neutral-700'}>
                      {state.idle_minutes === 0 ? 'ACTIVE' : `${state.idle_minutes}m IDLE`}
                    </strong>
                  </div>

                  {/* Nodes Status */}
                  <div className="p-2 bg-[#F4F1EA] border border-neutral-300">
                    <span className="text-[9px] text-neutral-500 font-bold block uppercase">NODE STATUS</span>
                    <div className="text-[10px] font-bold">
                      CAM: <span className={state.camera_online ? 'text-[#2F9E44]' : 'text-[#D64545]'}>{room.has_camera ? (state.camera_online ? 'ON' : 'OFF') : '—'}</span> · SENS: <span className={state.sensor_online ? 'text-[#2F9E44]' : 'text-neutral-500'}>{state.sensor_online ? 'ON' : 'OFF'}</span>
                    </div>
                  </div>
                </div>

                {/* Appliance Status & Controls */}
                <div className="p-2.5 bg-[#FAF8F5] border border-neutral-300 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold">
                      {isSimulationMode ? (
                        <>
                          AC: <span className={acSimOn ? 'text-[#2F9E44]' : 'text-neutral-500'}>{acSimOn ? 'SIMULATED ON' : 'SIMULATED OFF'}</span>
                        </>
                      ) : (
                        <>
                          AC: <span className="text-neutral-600">ACTUAL STATE UNKNOWN</span>
                        </>
                      )}
                    </span>
                    <span className="font-bold">
                      {isSimulationMode ? (
                        <>
                          LT: <span className={ltSimOn ? 'text-[#2F9E44]' : 'text-neutral-500'}>{ltSimOn ? 'SIMULATED ON' : 'SIMULATED OFF'}</span>
                        </>
                      ) : (
                        <>
                          LT: <span className="text-neutral-600">ACTUAL STATE UNKNOWN</span>
                        </>
                      )}
                    </span>
                  </div>

                  {/* Interactive Simulation Controls */}
                  {isSimulationMode ? (
                    <div className="flex items-center gap-1.5 pt-1">
                      <button
                        disabled={simActionMutation.isPending}
                        onClick={() =>
                          simActionMutation.mutate({
                            classroomId: room.id,
                            action: { device: 'ac', command: acSimOn ? 'off' : 'on' },
                          })
                        }
                        className={`flex-1 neo-btn py-1 text-[11px] font-bold ${
                          acSimOn ? 'bg-[#D64545] text-white' : 'bg-[#2F9E44] text-white'
                        }`}
                      >
                        {acSimOn ? 'TURN AC OFF' : 'TURN AC ON'}
                      </button>
                      <button
                        disabled={simActionMutation.isPending}
                        onClick={() =>
                          simActionMutation.mutate({
                            classroomId: room.id,
                            action: { device: 'light', command: ltSimOn ? 'off' : 'on' },
                          })
                        }
                        className={`flex-1 neo-btn py-1 text-[11px] font-bold ${
                          ltSimOn ? 'bg-[#111111] text-white' : 'bg-[#2F9E44] text-white'
                        }`}
                      >
                        {ltSimOn ? 'TURN LT OFF' : 'TURN LT ON'}
                      </button>
                    </div>
                  ) : (
                    <div className="text-[10px] text-neutral-500 font-mono">
                      Physical contactors unverified. Switch to Simulation Mode to operate virtual switches.
                    </div>
                  )}
                </div>

                {/* Energy Waste Warning Notification */}
                {hasPossibleWaste && (
                  <div className="p-2 bg-amber-50 border border-amber-300 text-amber-900 text-[10px] font-mono flex items-start gap-1.5">
                    <AlertTriangle size={13} className="shrink-0 text-amber-700 mt-0.5" />
                    <div>
                      <strong>Energy Waste Advisory:</strong> Room is confirmed empty while {isSimulationMode ? 'simulated ' : ''}appliances are active. Consider turning them OFF.
                    </div>
                  </div>
                )}

                {isUnknownOccupancy && (
                  <div className="p-2 bg-blue-50 border border-blue-200 text-blue-900 text-[10px] font-mono flex items-start gap-1.5">
                    <Info size={13} className="shrink-0 text-blue-700 mt-0.5" />
                    <div>
                      <strong>Occupancy Unconfirmed:</strong> Camera feed is offline. Verify room in person before turning appliances OFF.
                    </div>
                  </div>
                )}

                {/* Navigation and Timestamp */}
                <div className="flex items-center justify-between pt-1 border-t border-neutral-200 text-[10px] font-mono">
                  <span className="text-neutral-500">
                    Updated {new Date(state.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <Link
                    to={`/classrooms/${room.id}`}
                    className="font-bold underline text-neutral-800 hover:text-black flex items-center gap-1"
                  >
                    ROOM DETAILS <ExternalLink size={11} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming Room Tasks Panel (Section 2.4) */}
      <div className="border-2 border-ink bg-white p-4 shadow-neo space-y-3">
        <div className="flex items-center justify-between border-b-2 border-ink pb-2">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-neutral-700" />
            <h3 className="font-heading font-black text-sm uppercase">Upcoming Room Tasks</h3>
          </div>
          <span className="font-mono text-xs text-neutral-500 font-bold">
            Asia/Kolkata Timeline ({todaySchedule.length} sessions today)
          </span>
        </div>

        {todaySchedule.length === 0 ? (
          <div className="p-4 text-center font-mono text-xs text-neutral-500">
            No remaining scheduled room sessions for today.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 font-mono text-xs">
            {todaySchedule.slice(0, 6).map((entry) => {
              const sim = simRooms[entry.classroom_id];
              const acOn = isSimulationMode ? sim?.ac_simulated : false;
              const matchesExpected = acOn;

              return (
                <div key={entry.id} className="p-2.5 bg-[#F4F1EA] border border-neutral-300 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm">Room {entry.classroom_id}</span>
                    <span className="text-[10px] px-1 bg-white border border-neutral-300 font-bold">
                      {entry.start_time.slice(0, 5)} - {entry.end_time.slice(0, 5)}
                    </span>
                  </div>

                  <div className="text-[11px] text-neutral-700 truncate">
                    {entry.subject} ({entry.class_type.toUpperCase()})
                  </div>

                  <div className="flex items-center justify-between pt-1 text-[10px]">
                    <span className="text-[#2F9E44] font-bold">Expected: AC ON · LT ON</span>
                    {isSimulationMode && (
                      <span className={`px-1 font-bold ${matchesExpected ? 'text-[#2F9E44]' : 'text-amber-700'}`}>
                        {matchesExpected ? 'State Aligned' : 'Action Needed'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Actionable Alerts Section */}
      {alerts.length > 0 && (
        <div className="border-2 border-ink bg-white p-4 shadow-neo space-y-3">
          <div className="flex items-center justify-between border-b-2 border-ink pb-2">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-[#D64545]" />
              <h3 className="font-heading font-black text-sm uppercase">Active Incident Tasks ({alerts.length})</h3>
            </div>
            <span className="font-mono text-xs text-neutral-500">Action items for campus patrol</span>
          </div>

          <div className="space-y-2">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="p-3 border border-neutral-300 bg-[#F4F1EA] flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm">Room {alert.classroom_id}</span>
                    <span className="text-[10px] px-1.5 py-0.2 bg-[#FFEBEB] text-[#D64545] border border-[#D64545] font-bold">
                      {alert.type}
                    </span>
                    <span className="text-neutral-500 text-[10px]">
                      {new Date(alert.last_seen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="text-neutral-700 text-[11px] mt-0.5">{alert.headline}</div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => ackMutation.mutate(alert.id)}
                    className="neo-btn px-3 py-1 text-xs bg-[#2F9E44] text-white font-bold flex items-center gap-1"
                  >
                    <CheckCircle2 size={13} /> MARK INSPECTED
                  </button>
                  <Link
                    to={`/classrooms/${alert.classroom_id}`}
                    className="neo-btn px-2.5 py-1 text-xs bg-white text-neutral-800 font-bold"
                  >
                    VIEW ROOM
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};


