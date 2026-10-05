import type {
  ClassroomWithState,
  DashboardSummary,
  Alert,
  OccupancyCurvePoint,
  BlockAvgTemp,
  TimetableEntry,
  EnergyRecommendationsResponse,
  AnalyticsKpis,
  UnderutilizedRoom,
  SettingsResponse,
} from '../types';
import {
  MOCK_CLASSROOMS,
  MOCK_SUMMARY,
  MOCK_ALERTS,
  MOCK_OCCUPANCY_CURVE,
  MOCK_BLOCK_TEMP,
} from './mocks/data';

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';
export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface ApiClient {
  getSummary(): Promise<DashboardSummary>;
  getClassrooms(): Promise<ClassroomWithState[]>;
  getClassroom(id: string): Promise<ClassroomWithState>;
  getAlerts(params?: { status?: string; classroom_id?: string }): Promise<Alert[]>;
  getOccupancyCurve(): Promise<OccupancyCurvePoint[]>;
  getBlockTemperatures(): Promise<BlockAvgTemp[]>;
  acknowledgeAlert(alertId: string | number): Promise<{ success: boolean }>;
  resolveAlert(alertId: string | number): Promise<{ success: boolean }>;
  dispatchApplianceAction(
    classroomId: string,
    action: { device: 'ac' | 'light'; command: 'on' | 'off' }
  ): Promise<{ command_id: number; status: string }>;
  getTimetable(classroomId?: string): Promise<TimetableEntry[]>;
  getEnergyRecommendations(): Promise<EnergyRecommendationsResponse>;
  getSettings(): Promise<SettingsResponse>;
  updateSettings(payload: { preset?: string; values?: Record<string, number> }): Promise<SettingsResponse>;
  switchPreset(name: string): Promise<SettingsResponse>;
  getAnalyticsKpis(): Promise<AnalyticsKpis>;
  getUnderutilizedRooms(): Promise<UnderutilizedRoom[]>;
}


// In-memory mock adapter state
let mockClassrooms = [...MOCK_CLASSROOMS];
let mockAlerts = [...MOCK_ALERTS];

const MockAdapter: ApiClient = {
  async getSummary(): Promise<DashboardSummary> {
    return Promise.resolve(MOCK_SUMMARY);
  },

  async getClassrooms(): Promise<ClassroomWithState[]> {
    return Promise.resolve(mockClassrooms);
  },

  async getClassroom(id: string): Promise<ClassroomWithState> {
    const room = mockClassrooms.find((c) => c.id.toLowerCase() === id.toLowerCase());
    if (!room) {
      throw new Error(`Classroom ${id} not found`);
    }
    return Promise.resolve(room);
  },

  async getAlerts(params?: { status?: string; classroom_id?: string }): Promise<Alert[]> {
    let result = [...mockAlerts];
    if (params?.status) {
      result = result.filter((a) => a.status === params.status);
    }
    if (params?.classroom_id) {
      result = result.filter((a) => a.classroom_id === params.classroom_id);
    }
    return Promise.resolve(result);
  },

  async getOccupancyCurve(): Promise<OccupancyCurvePoint[]> {
    return Promise.resolve(MOCK_OCCUPANCY_CURVE);
  },

  async getBlockTemperatures(): Promise<BlockAvgTemp[]> {
    return Promise.resolve(MOCK_BLOCK_TEMP);
  },

  async acknowledgeAlert(alertId: string | number): Promise<{ success: boolean }> {
    mockAlerts = mockAlerts.map((a) =>
      String(a.id) === String(alertId)
        ? { ...a, status: 'acknowledged', acknowledged_at: new Date().toISOString() }
        : a
    );
    return Promise.resolve({ success: true });
  },

  async resolveAlert(alertId: string | number): Promise<{ success: boolean }> {
    mockAlerts = mockAlerts.filter((a) => String(a.id) !== String(alertId));
    return Promise.resolve({ success: true });
  },

  async dispatchApplianceAction(
    classroomId: string,
    action: { device: 'ac' | 'light'; command: 'on' | 'off' }
  ): Promise<{ command_id: number; status: string }> {
    mockClassrooms = mockClassrooms.map((c) => {
      if (c.id === classroomId) {
        return {
          ...c,
          state: {
            ...c.state,
            ac_status: action.device === 'ac' ? action.command === 'on' : c.state.ac_status,
            light_status: action.device === 'light' ? action.command === 'on' : c.state.light_status,
          },
        };
      }
      return c;
    });
    return Promise.resolve({ command_id: Math.floor(Math.random() * 1000), status: 'pending' });
  },

  async getTimetable(_classroomId?: string): Promise<TimetableEntry[]> {
    return Promise.resolve([]);
  },

  async getEnergyRecommendations(): Promise<EnergyRecommendationsResponse> {
    return Promise.resolve({ total_waste_kwh: 1.8, count: 1, recommendations: [] });
  },

  async getSettings(): Promise<SettingsResponse> {
    return Promise.resolve({
      preset: 'demo',
      values: {
        camera_fresh_sec: 15,
        sensor_fresh_sec: 30,
        idle_alert_min: 1,
        anomaly_alert_min: 2,
      },
    });
  },

  async updateSettings(payload: { preset?: string; values?: Record<string, number> }): Promise<SettingsResponse> {
    return Promise.resolve({
      preset: payload.preset || 'demo',
      values: {
        camera_fresh_sec: 15,
        sensor_fresh_sec: 30,
        idle_alert_min: 1,
        anomaly_alert_min: 2,
        ...payload.values,
      },
    });
  },

  async switchPreset(name: string): Promise<SettingsResponse> {
    return Promise.resolve({
      preset: name,
      values: {
        camera_fresh_sec: 15,
        sensor_fresh_sec: 30,
        idle_alert_min: name === 'demo' ? 1 : 15,
        anomaly_alert_min: name === 'demo' ? 2 : 15,
      },
    });
  },

  async getAnalyticsKpis(): Promise<AnalyticsKpis> {
    return Promise.resolve({
      campus_utilization_pct: 64.2,
      schedule_adherence_pct: 88.5,
      peak_utilization_hour: '11:00 - 12:00',
      total_scheduled_sessions: 115,
      active_occupied_rooms: 4,
      total_classrooms: 23,
    });
  },

  async getUnderutilizedRooms(): Promise<UnderutilizedRoom[]> {
    return Promise.resolve([]);
  },
};

const HttpAdapter: ApiClient = {
  async getSummary(): Promise<DashboardSummary> {
    const res = await fetch(`${API_BASE}/api/dashboard/summary`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  async getClassrooms(): Promise<ClassroomWithState[]> {
    const res = await fetch(`${API_BASE}/api/classrooms`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  async getClassroom(id: string): Promise<ClassroomWithState> {
    const res = await fetch(`${API_BASE}/api/classrooms/${id}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return {
      ...data.classroom,
      state: data.state,
    };
  },

  async getAlerts(params?: { status?: string; classroom_id?: string }): Promise<Alert[]> {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.classroom_id) query.set('classroom_id', params.classroom_id);
    const res = await fetch(`${API_BASE}/api/alerts?${query.toString()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  async getOccupancyCurve(): Promise<OccupancyCurvePoint[]> {
    const res = await fetch(`${API_BASE}/api/analytics/utilization`);
    if (!res.ok) return MockAdapter.getOccupancyCurve();
    return res.json();
  },

  async getBlockTemperatures(): Promise<BlockAvgTemp[]> {
    const res = await fetch(`${API_BASE}/api/analytics/environment`);
    if (!res.ok) return MockAdapter.getBlockTemperatures();
    return res.json();
  },

  async acknowledgeAlert(alertId: string | number): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/api/alerts/${alertId}/acknowledge`, { method: 'POST' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  async resolveAlert(alertId: string | number): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/api/alerts/${alertId}/resolve`, { method: 'POST' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  async dispatchApplianceAction(
    classroomId: string,
    action: { device: 'ac' | 'light'; command: 'on' | 'off' }
  ): Promise<{ command_id: number; status: string }> {
    const res = await fetch(`${API_BASE}/api/classrooms/${classroomId}/actions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(action),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  async getTimetable(classroomId?: string): Promise<TimetableEntry[]> {
    const query = classroomId ? `?classroom_id=${classroomId}` : '';
    const res = await fetch(`${API_BASE}/api/timetable${query}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  async getEnergyRecommendations(): Promise<EnergyRecommendationsResponse> {
    const res = await fetch(`${API_BASE}/api/dashboard/energy-recommendations`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  async getSettings(): Promise<SettingsResponse> {
    const res = await fetch(`${API_BASE}/api/settings`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  async updateSettings(payload: { preset?: string; values?: Record<string, number> }): Promise<SettingsResponse> {
    const res = await fetch(`${API_BASE}/api/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  async switchPreset(name: string): Promise<SettingsResponse> {
    const res = await fetch(`${API_BASE}/api/settings/preset/${name}`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  async getAnalyticsKpis(): Promise<AnalyticsKpis> {
    const res = await fetch(`${API_BASE}/api/analytics/kpis`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  async getUnderutilizedRooms(): Promise<UnderutilizedRoom[]> {
    const res = await fetch(`${API_BASE}/api/analytics/underutilized`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },
};

export const api: ApiClient = USE_MOCKS ? MockAdapter : HttpAdapter;

