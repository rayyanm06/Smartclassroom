import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { CheckCircle2, Clock, MapPin, RefreshCw, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export const WatchmanPage: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: alerts = [] } = useQuery({
    queryKey: ['watchman-alerts'],
    queryFn: () => api.getAlerts({ status: 'open' }),
    refetchInterval: 3000,
  });

  const ackMutation = useMutation({
    mutationFn: (alertId: string | number) => api.acknowledgeAlert(alertId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchman-alerts'] });
    },
  });

  return (
    <div className="min-h-screen bg-[#F4F1EA] text-[#111111] p-3 sm:p-5 max-w-xl mx-auto">
      {/* Top Header: Simple, High-contrast, Mobile First */}
      <header className="border-b-2 border-ink pb-3 mb-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-[#D64545] rounded-full animate-pulse" />
            <span className="font-mono text-xs font-bold tracking-wider text-neutral-600 uppercase">
              CAMPUS PATROL TERMINAL
            </span>
          </div>
          <h1 className="font-heading font-black text-xl uppercase tracking-tight">
            Security & Energy Patrol
          </h1>
          <p className="font-mono text-[11px] text-neutral-500">
            Action list for open anomalies and energy wastage
          </p>
        </div>
        <button
          onClick={() => queryClient.invalidateQueries({ queryKey: ['watchman-alerts'] })}
          className="p-2 border-2 border-ink bg-white active:translate-y-0.5"
          title="Refresh Task Feed"
        >
          <RefreshCw size={16} />
        </button>
      </header>

      {/* Main Task List */}
      <main className="space-y-3">
        {alerts.length === 0 ? (
          <div className="border-2 border-ink bg-white p-8 text-center space-y-2">
            <ShieldCheck size={36} className="mx-auto text-[#2F9E44]" />
            <h2 className="font-heading font-bold text-base uppercase">ALL CLASSROOMS SECURE</h2>
            <p className="font-mono text-xs text-neutral-500">
              No active energy waste or occupancy anomalies detected across college rooms.
            </p>
          </div>
        ) : (
          alerts.map((alert) => {
            const isCritical = alert.severity === 'critical' || alert.type.includes('ANOMALY');
            return (
              <div
                key={alert.id}
                className="border-2 border-ink bg-white p-4 shadow-neo space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-mono text-[10px] font-bold px-1.5 py-0.5 border ${
                        isCritical
                          ? 'bg-[#D64545] text-white border-[#D64545]'
                          : 'bg-[#F2C94C] text-[#111111] border-[#F2C94C]'
                      }`}
                    >
                      {alert.type}
                    </span>
                    <span className="font-mono text-xs text-neutral-500 flex items-center gap-1">
                      <Clock size={12} />
                      {new Date(alert.last_seen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin size={16} className="text-neutral-700" />
                    <h2 className="font-heading font-black text-lg uppercase tracking-tight">
                      Room {alert.classroom_id}
                    </h2>
                  </div>
                  <p className="font-mono text-xs font-bold text-[#111111]">
                    {alert.headline}
                  </p>
                  <p className="font-mono text-[11px] text-neutral-600 mt-1">
                    {alert.detail}
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-1 border-t border-neutral-200">
                  <button
                    onClick={() => ackMutation.mutate(alert.id)}
                    className="flex-1 neo-btn py-2 text-xs bg-[#2F9E44] text-white font-bold flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 size={16} /> MARK INSPECTED
                  </button>
                  <Link
                    to={`/classrooms/${alert.classroom_id}`}
                    className="neo-btn px-3 py-2 text-xs bg-white font-bold"
                  >
                    DETAILS
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </main>
    </div>
  );
};
