import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { Printer, Download, RefreshCw, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

export const ReportsPage: React.FC = () => {
  const { data: summary } = useQuery({
    queryKey: ['reports-summary'],
    queryFn: () => api.getSummary(),
  });

  const { data: classrooms = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ['reports-classrooms'],
    queryFn: () => api.getClassrooms(),
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ['reports-alerts'],
    queryFn: () => api.getAlerts(),
  });

  const openAnomalies = alerts.filter(
    (a) => a.status === 'open' && a.type.includes('ANOMALY')
  ).length;

  const exportComplianceCsv = () => {
    let csv = 'Room ID,Room Name,Floor,Capacity,Room Type,Camera Installed,PIR Installed,DHT Installed,Occupancy State,Confidence,People Count,Temperature C,Humidity %,AC Status,Light Status,Idle Minutes\n';
    classrooms.forEach((c) => {
      const s = c.state;
      csv += `"${c.id}","${c.name}",${c.floor},${c.capacity},"${c.room_type}",${c.has_camera},${c.has_pir},${c.has_dht},"${s?.occupancy_state ?? 'UNKNOWN'}","${s?.confidence_level ?? 'none'}",${s?.people_count ?? 0},${s?.temperature ?? ''},${s?.humidity ?? ''},${s?.ac_status ? 'ON' : 'OFF'},${s?.light_status ? 'ON' : 'OFF'},${s?.idle_minutes ?? 0}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `campus-compliance-audit-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="border-ink bg-white p-4 shadow-neo flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="neo-header-strip inline-block mb-2">AUDIT & COMPLIANCE · REPORT EXPORTS</span>
          <h1 className="text-2xl font-bold font-heading uppercase tracking-tight">Facility Reports</h1>
          <p className="text-sm text-neutral-600 font-mono">
            Print-formatted classroom audits and administrative CSV records
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            className="neo-btn p-1.5 text-xs bg-white"
            title="Refresh Report Data"
          >
            <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
          </button>
          <button className="neo-btn px-3 py-1.5 text-xs bg-white font-mono font-bold flex items-center gap-1.5" onClick={() => window.print()}>
            <Printer size={14} /> PRINT REPORT
          </button>
          <button
            onClick={exportComplianceCsv}
            className="neo-btn px-3 py-1.5 text-xs bg-[#111111] text-white font-mono font-bold flex items-center gap-1.5"
          >
            <Download size={14} /> EXPORT COMPLIANCE CSV
          </button>
        </div>
      </div>

      <div className="neo-card p-6 border-ink bg-white">
        <div className="border-b-2 border-ink pb-4 mb-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <FileText size={20} />
            <h2 className="font-heading font-black text-xl uppercase tracking-tight">
              SPIT CAMPUS RESOURCE AUDIT SUMMARY
            </h2>
          </div>
          <p className="text-xs font-mono text-neutral-600">
            Generated: {new Date().toLocaleString()} (Asia/Kolkata) · Standard Academic Audit Spec
          </p>
        </div>

        {/* Live Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-xs font-mono">
          <div className="p-3 bg-[#F4F1EA] border border-neutral-300">
            <span className="text-neutral-500 block">TOTAL ROOM NODES</span>
            <span className="text-lg font-bold">{summary?.total_classrooms ?? classrooms.length} Units</span>
          </div>
          <div className="p-3 bg-[#F4F1EA] border border-neutral-300">
            <span className="text-neutral-500 block">CAMPUS UTILIZATION</span>
            <span className="text-lg font-bold">{summary?.rooms_in_use_pct ?? 0}% in use</span>
          </div>
          <div className="p-3 bg-[#F4F1EA] border border-neutral-300">
            <span className="text-neutral-500 block">ENERGY ALERTS</span>
            <span className="text-lg font-bold">{summary?.energy_alerts ?? 0} Active</span>
          </div>
          <div className="p-3 bg-[#F4F1EA] border border-neutral-300">
            <span className="text-neutral-500 block">OCCUPANCY ANOMALIES</span>
            <span className="text-lg font-bold">{openAnomalies} Incidents</span>
          </div>
        </div>

        {/* Tabular Classroom Audit Breakdown */}
        {isLoading ? (
          <div className="p-12 text-center font-mono text-xs">Compiling audit records...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs border border-neutral-200">
              <thead className="bg-[#F4F1EA] border-b border-ink">
                <tr>
                  <th className="p-2 border-r border-neutral-300">ROOM</th>
                  <th className="p-2 border-r border-neutral-300">NAME / TYPE</th>
                  <th className="p-2 border-r border-neutral-300">FL</th>
                  <th className="p-2 border-r border-neutral-300">SEATS</th>
                  <th className="p-2 border-r border-neutral-300">SENSORS</th>
                  <th className="p-2 border-r border-neutral-300">STATE</th>
                  <th className="p-2 border-r border-neutral-300">CLIMATE</th>
                  <th className="p-2 border-r border-neutral-300">APPLIANCES</th>
                  <th className="p-2">EVIDENCE REASON</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {classrooms.map((c) => {
                  const s = c.state;
                  return (
                    <tr key={c.id} className="hover:bg-neutral-50">
                      <td className="p-2 font-bold border-r border-neutral-200">
                        <Link to={`/classrooms/${c.id}`} className="hover:underline">
                          {c.id}
                        </Link>
                      </td>
                      <td className="p-2 text-neutral-700 border-r border-neutral-200">
                        {c.name} ({c.room_type.toUpperCase()})
                      </td>
                      <td className="p-2 border-r border-neutral-200">{c.floor}</td>
                      <td className="p-2 border-r border-neutral-200">{c.capacity}</td>
                      <td className="p-2 border-r border-neutral-200 text-[10px]">
                        {[
                          c.has_camera ? 'CAM' : null,
                          c.has_pir ? 'PIR' : null,
                          c.has_dht ? 'DHT' : null,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </td>
                      <td className="p-2 border-r border-neutral-200 font-bold">
                        <span className={`px-1.5 py-0.5 text-[10px] border border-ink ${
                          s?.occupancy_state === 'OCCUPIED'
                            ? 'bg-[#2F9E44] text-white'
                            : s?.occupancy_state === 'EMPTY'
                            ? 'bg-neutral-200 text-neutral-800'
                            : 'bg-amber-400 text-black'
                        }`}>
                          {s?.occupancy_state ?? 'UNKNOWN'}
                        </span>
                      </td>
                      <td className="p-2 border-r border-neutral-200">
                        {s?.temperature !== null ? `${s.temperature}°C · ${s.humidity}%` : 'OFFLINE'}
                      </td>
                      <td className="p-2 border-r border-neutral-200">
                        <span className={s?.ac_status ? 'text-[#2F9E44] font-bold' : 'text-neutral-400'}>
                          AC:{s?.ac_status ? 'ON' : 'OFF'}
                        </span>{' '}
                        ·{' '}
                        <span className={s?.light_status ? 'text-[#2F9E44] font-bold' : 'text-neutral-400'}>
                          LT:{s?.light_status ? 'ON' : 'OFF'}
                        </span>
                      </td>
                      <td className="p-2 text-neutral-600 text-[10px] truncate max-w-[200px]" title={s?.reasons[0]}>
                        {s?.reasons[0] || 'Telemetry active'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
