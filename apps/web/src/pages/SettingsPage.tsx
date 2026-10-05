import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { Save, CheckCircle2, RefreshCw } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [saveSuccess, setSaveSuccess] = useState(false);

  const { data: settingsData, isLoading } = useQuery({
    queryKey: ['system-settings'],
    queryFn: () => api.getSettings(),
  });

  const [preset, setPreset] = useState<string>('demo');
  const [cameraFreshSec, setCameraFreshSec] = useState<number>(15);
  const [sensorFreshSec, setSensorFreshSec] = useState<number>(30);
  const [idleAlertMin, setIdleAlertMin] = useState<number>(1);
  const [anomalyAlertMin, setAnomalyAlertMin] = useState<number>(2);

  // Sync inputs with loaded settings
  useEffect(() => {
    if (settingsData) {
      setPreset(settingsData.preset);
      const vals = settingsData.values || {};
      if (vals.camera_fresh_sec !== undefined) setCameraFreshSec(vals.camera_fresh_sec);
      if (vals.sensor_fresh_sec !== undefined) setSensorFreshSec(vals.sensor_fresh_sec);
      if (vals.idle_alert_min !== undefined) setIdleAlertMin(vals.idle_alert_min);
      if (vals.anomaly_alert_min !== undefined) setAnomalyAlertMin(vals.anomaly_alert_min);
    }
  }, [settingsData]);

  const presetMutation = useMutation({
    mutationFn: (newPreset: string) => api.switchPreset(newPreset),
    onSuccess: (data) => {
      queryClient.setQueryData(['system-settings'], data);
      setPreset(data.preset);
      const vals = data.values || {};
      if (vals.camera_fresh_sec !== undefined) setCameraFreshSec(vals.camera_fresh_sec);
      if (vals.sensor_fresh_sec !== undefined) setSensorFreshSec(vals.sensor_fresh_sec);
      if (vals.idle_alert_min !== undefined) setIdleAlertMin(vals.idle_alert_min);
      if (vals.anomaly_alert_min !== undefined) setAnomalyAlertMin(vals.anomaly_alert_min);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    },
  });

  const saveMutation = useMutation({
    mutationFn: () =>
      api.updateSettings({
        preset,
        values: {
          camera_fresh_sec: Number(cameraFreshSec),
          sensor_fresh_sec: Number(sensorFreshSec),
          idle_alert_min: Number(idleAlertMin),
          anomaly_alert_min: Number(anomalyAlertMin),
        },
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(['system-settings'], data);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    },
  });

  return (
    <div className="space-y-6">
      <div className="border-ink bg-white p-4 shadow-neo flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="neo-header-strip inline-block mb-2">SYSTEM PARAMETERS · THRESHOLD CONFIGURATION</span>
          <h1 className="text-2xl font-bold font-heading uppercase tracking-tight">System Settings</h1>
          <p className="text-sm text-neutral-600 font-mono">
            Threshold tuning, timing presets (§9), and sensor simulator controls
          </p>
        </div>
        <div className="flex items-center gap-3">
          {saveSuccess && (
            <span className="flex items-center gap-1.5 px-3 py-1 bg-[#2F9E44]/15 border border-[#2F9E44] text-[#2F9E44] font-mono text-xs font-bold animate-pulse">
              <CheckCircle2 size={14} /> PERSISTED TO MYSQL
            </span>
          )}
          <button
            disabled={saveMutation.isPending || isLoading}
            onClick={() => saveMutation.mutate()}
            className="neo-btn px-4 py-1.5 text-xs bg-[#111111] text-white font-mono font-bold flex items-center gap-1.5"
          >
            <Save size={14} /> {saveMutation.isPending ? 'SAVING...' : 'SAVE SETTINGS'}
          </button>
        </div>
      </div>

      {/* Preset Switcher (§2, §9) */}
      <div className="neo-card p-5 bg-white">
        <h2 className="font-heading font-bold text-base uppercase border-b-2 border-ink pb-2 mb-4 flex items-center justify-between">
          <span>Operational Preset</span>
          <span className="text-xs font-mono text-neutral-500">Locked Decision D10</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => presetMutation.mutate('demo')}
            className={`p-4 border-2 border-ink text-left transition-all ${
              preset === 'demo' ? 'bg-[#F2C94C]/20 shadow-neo' : 'bg-white opacity-60 hover:opacity-100'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-sm">DEMO PRESET</span>
              {preset === 'demo' && (
                <span className="px-2 py-0.5 bg-[#111111] text-white text-[10px] font-mono">SELECTED</span>
              )}
            </div>
            <p className="text-xs text-neutral-600 font-mono">
              Aggressive timings: alerts fire in 1-2 minutes for live demonstrations. Ideal for evaluation.
            </p>
          </button>

          <button
            type="button"
            onClick={() => presetMutation.mutate('production')}
            className={`p-4 border-2 border-ink text-left transition-all ${
              preset === 'production' ? 'bg-[#2F6FDE]/20 shadow-neo' : 'bg-white opacity-60 hover:opacity-100'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-sm">PRODUCTION PRESET</span>
              {preset === 'production' && (
                <span className="px-2 py-0.5 bg-[#111111] text-white text-[10px] font-mono">SELECTED</span>
              )}
            </div>
            <p className="text-xs text-neutral-600 font-mono">
              Conservative timings: 15-minute grace & idle windows to prevent false positive alerts during regular campus operation.
            </p>
          </button>
        </div>
      </div>

      {/* Thresholds Table */}
      <div className="neo-card p-5 bg-white">
        <h2 className="font-heading font-bold text-base uppercase border-b-2 border-ink pb-2 mb-4">
          Timing Threshold Values (Seconds / Minutes)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          <div className="space-y-1">
            <label className="text-neutral-600 block font-bold">CAMERA FRESHNESS WINDOW (sec)</label>
            <input
              type="number"
              value={cameraFreshSec}
              onChange={(e) => setCameraFreshSec(Number(e.target.value))}
              className="w-full border-ink p-2 bg-[#F4F1EA] font-mono"
            />
          </div>
          <div className="space-y-1">
            <label className="text-neutral-600 block font-bold">SENSOR FRESHNESS WINDOW (sec)</label>
            <input
              type="number"
              value={sensorFreshSec}
              onChange={(e) => setSensorFreshSec(Number(e.target.value))}
              className="w-full border-ink p-2 bg-[#F4F1EA] font-mono"
            />
          </div>
          <div className="space-y-1">
            <label className="text-neutral-600 block font-bold">IDLE ENERGY ALERT THRESHOLD (min)</label>
            <input
              type="number"
              value={idleAlertMin}
              onChange={(e) => setIdleAlertMin(Number(e.target.value))}
              className="w-full border-ink p-2 bg-[#F4F1EA] font-mono"
            />
          </div>
          <div className="space-y-1">
            <label className="text-neutral-600 block font-bold">ANOMALY TRIGGER THRESHOLD (min)</label>
            <input
              type="number"
              value={anomalyAlertMin}
              onChange={(e) => setAnomalyAlertMin(Number(e.target.value))}
              className="w-full border-ink p-2 bg-[#F4F1EA] font-mono"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
