import type {
  ClassroomWithState,
  DashboardSummary,
  Alert,
  OccupancyCurvePoint,
  BlockAvgTemp,
} from '../types';
import {
  MOCK_CLASSROOMS,
  MOCK_SUMMARY,
  MOCK_ALERTS,
  MOCK_OCCUPANCY_CURVE,
  MOCK_BLOCK_TEMP,
} from './mocks/data';

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS !== 'false';
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

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
    return res.json();
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
};

export const api: ApiClient = USE_MOCKS ? MockAdapter : HttpAdapter;
