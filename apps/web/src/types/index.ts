// TypeScript definitions mirroring backend schemas (§6, §7)

export type OccupancyState =
  | 'OCCUPIED'
  | 'EMPTY'
  | 'EXPECTED_OCCUPANCY'
  | 'UNEXPECTED_OCCUPANCY'
  | 'OCCUPANCY_ANOMALY'
  | 'SENSOR_UNCERTAIN'
  | 'UNKNOWN';

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export type AlertSeverity = 'info' | 'warning' | 'critical';

export type AlertType =
  | 'ENERGY_AC_IDLE'
  | 'ENERGY_LIGHTS_IDLE'
  | 'UNEXPECTED_OCCUPANCY'
  | 'OCCUPANCY_ANOMALY'
  | 'SENSOR_OFFLINE'
  | 'CAMERA_OFFLINE';

export type AlertStatus = 'open' | 'acknowledged' | 'resolved';

export interface DeviceCommandItem {
  id: number;
  device: 'ac' | 'light';
  command: 'on' | 'off';
  status: 'pending' | 'acked' | 'expired';
  created_at: string;
  acked_at: string | null;
}

export interface Classroom {
  id: string; // e.g. 'A101'
  name: string;
  building: string;
  floor: number;
  capacity: number;
  room_type: 'lecture' | 'lab' | 'seminar';
  has_camera: boolean;
  has_pir: boolean;
  has_dht: boolean;
  ac_rated_kw: number;
  lights_rated_kw: number;
  active: boolean;
}

export interface ClassroomState {
  classroom_id: string;
  occupancy_state: OccupancyState;
  confidence_level: ConfidenceLevel;
  reasons: string[];
  people_count: number | null;
  expected_occupancy: boolean;
  timetable_entry_id: number | null;
  last_camera_at: string | null;
  last_camera_count: number | null;
  last_sensor_at: string | null;
  last_motion_at: string | null;
  last_presence_at: string | null;
  idle_minutes: number;
  temperature: number | null;
  humidity: number | null;
  ac_status: boolean;
  light_status: boolean;
  camera_online: boolean;
  sensor_online: boolean;
  updated_at: string;
}

export interface ClassroomWithState extends Classroom {
  state: ClassroomState;
  recent_commands?: DeviceCommandItem[];
  current_entry?: {
    id: number;
    subject: string;
    faculty: string;
    start_time: string;
    end_time: string;
    class_type: string;
  } | null;
  next_entry?: {
    id: number;
    subject: string;
    faculty: string;
    start_time: string;
    end_time: string;
    class_type: string;
  } | null;
  open_alerts?: Alert[];
  simulated_state?: SimulatedClassroomState;
}

export interface TimetableEntry {
  id: number;
  classroom_id: string;
  subject: string;
  faculty: string;
  day_of_week: number; // 0=Mon ... 6=Sun
  start_time: string; // "10:00:00"
  end_time: string; // "11:00:00"
  class_type: 'lecture' | 'lab' | 'tutorial' | 'exam' | 'other' | string;
  division?: string | null;
  batch?: string | null;
  valid_from: string | null;
  valid_to: string | null;
}

export interface Alert {
  id: number | string;
  classroom_id: string;
  type: AlertType;
  severity: AlertSeverity;
  headline: string;
  detail: string;
  status: AlertStatus;
  first_seen: string;
  last_seen: string;
  resolved_at: string | null;
  acknowledged_at: string | null;
}

export interface DashboardSummary {
  total_classrooms: number;
  occupied_now: number;
  empty_now: number;
  expected_now: number;
  unexpected_now: number;
  anomalies: number;
  sensor_uncertain: number;
  unknown_now?: number;
  cameras_offline?: number;
  sensors_offline?: number;
  energy_alerts: number;
  rooms_in_use_pct: number;
  seat_utilization_pct: number;
  avg_temperature: number;
  camera_feeds_active: string; // e.g. "1 / 1"
  sensors_online: string; // e.g. "12 / 12"
  simulation_enabled?: boolean;
  simulated_appliances_on?: number;
  possible_energy_waste_rooms?: number;
}

export interface SimulatedCommandItem {
  id: number;
  classroom_id: string;
  device: 'ac' | 'light';
  command: 'on' | 'off';
  status: string;
  resulting_state: boolean;
  detail: string;
  created_at: string;
}

export interface SimulatedClassroomState {
  classroom_id: string;
  ac_simulated: boolean;
  light_simulated: boolean;
  ac_switched_at: string;
  light_switched_at: string;
  energy_consumed_kwh: number;
  energy_saved_kwh: number;
  energy_wasted_kwh: number;
  updated_at: string;
  recent_commands: SimulatedCommandItem[];
}

export interface SimulationStatus {
  simulation_enabled: boolean;
  banner_message: string;
  total_simulated_appliances_on: number;
  simulated_ac_on_count: number;
  simulated_lights_on_count: number;
  total_energy_consumed_kwh: number;
  total_energy_saved_kwh: number;
  total_energy_wasted_kwh: number;
  rooms_with_waste: string[];
}

export interface EnergyRecommendation {
  classroom_id: string;
  building?: string;
  floor?: number;
  headline: string;
  context: string;
  idle_minutes: number;
  severity: AlertSeverity;
  actions: Array<{ device: 'ac' | 'light'; command: 'on' | 'off' }>;
  estimated_waste_kwh: number;
  ac_status?: boolean;
  light_status?: boolean;
}

export interface EnergyRecommendationsResponse {
  total_waste_kwh: number;
  count: number;
  recommendations: EnergyRecommendation[];
}

export interface AnalyticsKpis {
  campus_utilization_pct: number;
  schedule_adherence_pct: number;
  peak_utilization_hour: string;
  total_scheduled_sessions: number;
  active_occupied_rooms: number;
  total_classrooms: number;
}

export interface UnderutilizedRoom {
  id: string;
  name: string;
  floor: number;
  capacity: number;
  room_type: string;
  scheduled_weekly_hours: number;
  weekly_utilization_pct: number;
  current_state: string;
  recommendation: string;
}

export interface SettingsResponse {
  preset: 'demo' | 'production' | string;
  values: {
    camera_fresh_sec: number;
    sensor_fresh_sec: number;
    idle_alert_min: number;
    anomaly_alert_min: number;
    [key: string]: number;
  };
}

export interface OccupancyCurvePoint {
  time: string; // "09:00"
  actualOccupied: number;
  expectedOccupied: number;
}

export interface BlockAvgTemp {
  block: string;
  temp: number;
}

