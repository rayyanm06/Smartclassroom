import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { Check, CheckCheck, Clock, RefreshCw, AlertOctagon, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SEVERITY_STYLES } from '../lib/styles';

export const AlertsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedStatus, setSelectedStatus] = useState<string>('open');
  const [roomFilter, setRoomFilter] = useState<string>('');

  const { data: alerts = [], isLoading, isFetching } = useQuery({
    queryKey: ['alerts-list', selectedStatus],
    queryFn: () =>
      api.getAlerts(selectedStatus === 'all' ? undefined : { status: selectedStatus }),
    refetchInterval: 3000,
  });

  const ackMutation = useMutation({
    mutationFn: (id: string | number) => api.acknowledgeAlert(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts-list'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
  });

  const resolveMutation = useMutation({
    mutationFn: (id: string | number) => api.resolveAlert(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts-list'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
  });

  const filteredAlerts = alerts.filter((a) =>
    roomFilter ? a.classroom_id.toLowerCase().includes(roomFilter.toLowerCase()) : true
  );

  const openCount = alerts.filter((a) => a.status === 'open').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-ink bg-white p-4 shadow-neo flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="neo-header-strip inline-block mb-2">INCIDENT LOG · EXCEPTION ENGINE</span>
          <h1 className="text-2xl font-bold font-heading uppercase tracking-tight">Active Alerts & Incidents</h1>
          <p className="text-sm text-neutral-600 font-mono">
            Deduplicated event registry with auto-resolution and acknowledgement workflows
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-2.5 py-1 text-white font-mono text-xs font-bold ${
            openCount > 0 ? 'bg-[#D64545]' : 'bg-[#2F9E44]'
          }`}>
            {openCount} OPEN ALERTS
          </span>
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['alerts-list'] })}
            className="neo-btn p-1.5 text-xs bg-white"
            title="Refresh Incident Log"
          >
            <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="neo-card p-4 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-neutral-500" />
          <span className="text-xs font-mono font-bold uppercase text-neutral-600">STATUS:</span>
          {(['open', 'acknowledged', 'resolved', 'all'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`px-3 py-1 text-xs font-mono font-bold uppercase border-2 ${
                selectedStatus === st
                  ? 'bg-[#111111] text-white border-ink'
                  : 'bg-[#F4F1EA] text-neutral-700 border-neutral-300 hover:border-ink'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-neutral-600">Filter Room:</span>
          <input
            type="text"
            placeholder="e.g. 508"
            value={roomFilter}
            onChange={(e) => setRoomFilter(e.target.value)}
            className="border-ink px-2 py-1 bg-[#F4F1EA] text-xs font-mono w-24"
          />
        </div>
      </div>

      {/* Alerts Feed */}
      {isLoading ? (
        <div className="p-12 text-center font-mono text-xs bg-white border-2 border-ink">
          Loading campus alerts...
        </div>
      ) : filteredAlerts.length === 0 ? (
        <div className="neo-card p-12 text-center bg-white space-y-3">
          <AlertOctagon size={36} className="mx-auto text-[#2F9E44]" />
          <h2 className="font-heading font-black text-xl uppercase tracking-tight">NO ALERTS FOUND</h2>
          <p className="text-xs font-mono text-neutral-600 max-w-sm mx-auto">
            No incidents matching status "{selectedStatus}". All monitored classrooms are operating within normal parameters.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAlerts.map((alert) => {
            const sev = SEVERITY_STYLES[alert.severity] || SEVERITY_STYLES.info;
            const isResolved = alert.status === 'resolved';
            const isAcknowledged = alert.status === 'acknowledged';

            return (
              <div
                key={alert.id}
                className={`neo-card p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white ${
                  isResolved ? 'opacity-60 bg-neutral-50' : ''
                }`}
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-bold text-xs bg-neutral-100 px-1.5 py-0.5 border border-neutral-300">
                      ALT-{alert.id}
                    </span>
                    <Link
                      to={`/classrooms/${alert.classroom_id}`}
                      className="font-mono font-black text-sm text-[#111111] hover:underline"
                    >
                      Room {alert.classroom_id}
                    </Link>
                    <span className={`px-2 py-0.5 text-[10px] font-bold uppercase font-mono ${sev.bg} ${sev.text}`}>
                      {alert.severity}
                    </span>
                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase font-mono bg-neutral-200 text-neutral-800">
                      {alert.status}
                    </span>
                    <span className="text-xs text-neutral-500 font-mono flex items-center gap-1">
                      <Clock size={12} />
                      {new Date(alert.last_seen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-[#111111]">{alert.headline}</h3>
                  <p className="text-xs text-neutral-600 font-mono">{alert.detail}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {!isAcknowledged && !isResolved && (
                    <button
                      disabled={ackMutation.isPending}
                      onClick={() => ackMutation.mutate(alert.id)}
                      className="neo-btn px-3 py-1.5 text-xs bg-white font-mono font-bold flex items-center gap-1.5"
                    >
                      <Check size={14} /> ACKNOWLEDGE
                    </button>
                  )}
                  {!isResolved && (
                    <button
                      disabled={resolveMutation.isPending}
                      onClick={() => resolveMutation.mutate(alert.id)}
                      className="neo-btn px-3 py-1.5 text-xs bg-[#111111] text-white font-mono font-bold flex items-center gap-1.5"
                    >
                      <CheckCheck size={14} /> RESOLVE
                    </button>
                  )}
                  <Link
                    to={`/classrooms/${alert.classroom_id}`}
                    className="neo-btn px-2.5 py-1.5 text-xs bg-neutral-100 font-mono font-bold"
                  >
                    ROOM
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
