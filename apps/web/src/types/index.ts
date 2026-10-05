// TypeScript definitions mirroring backend schemas (§6, §7)

export type OccupancyState =
  | 'OCCUPIED'
  | 'EMPTY'
  | 'EXPECTED_OCCUPANCY'
  | 'UNEXPECTED_OCCUPANCY'
  | 'OCCUPANCY_ANOMALY'
  | 'SENSOR_UNCERTAIN';

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
  energy_alerts: number;
  rooms_in_use_pct: number;
  seat_utilization_pct: number;
  avg_temperature: number;
  camera_feeds_active: string; // e.g. "1 / 1"
  sensors_online: string; // e.g. "12 / 12"
}

export interface EnergyRecommendation {
  classroom_id: string;
  headline: string;
  context: string;
  idle_minutes: number;
  severity: AlertSeverity;
  actions: Array<{ device: 'ac' | 'light'; command: 'on' | 'off' }>;
  estimated_waste_kwh: number;
  estimate_note: string;
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
