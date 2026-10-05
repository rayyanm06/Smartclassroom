import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { Download, RefreshCw, BarChart2, TrendingDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';

export const AnalyticsPage: React.FC = () => {
  const { data: kpis, isLoading: kpisLoading, isFetching: kpisFetching, refetch } = useQuery({
    queryKey: ['analytics-kpis'],
    queryFn: () => api.getAnalyticsKpis(),
    refetchInterval: 10000,
  });

  const { data: curveData = [] } = useQuery({
    queryKey: ['analytics-curve'],
    queryFn: () => api.getOccupancyCurve(),
    refetchInterval: 10000,
  });

  const { data: underutilized = [] } = useQuery({
    queryKey: ['analytics-underutilized'],
    queryFn: () => api.getUnderutilizedRooms(),
    refetchInterval: 30000,
  });

  const exportCsv = () => {
    let csv = 'Hour,Expected Occupied Rooms,Actual Occupied Rooms\n';
    curveData.forEach((pt) => {
      csv += `"${pt.time}",${pt.expectedOccupied},${pt.actualOccupied}\n`;
    });
    csv += '\nRoom ID,Room Name,Floor,Capacity,Weekly Scheduled Hours,Utilization %\n';
    underutilized.forEach((r) => {
      csv += `"${r.id}","${r.name}",${r.floor},${r.capacity},${r.scheduled_weekly_hours},${r.weekly_utilization_pct}%\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `campus-analytics-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="border-ink bg-white p-4 shadow-neo flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="neo-header-strip inline-block mb-2">CAMPUS ANALYTICS · METRIC FUSION</span>
          <h1 className="text-2xl font-bold font-heading uppercase tracking-tight">Occupancy & Resource Analytics</h1>
          <p className="text-sm text-neutral-600 font-mono">
            Empirical metrics computed over timetable sessions and live sensor states
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            className="neo-btn p-1.5 text-xs bg-white"
            title="Refresh Analytics"
          >
            <RefreshCw size={14} className={kpisFetching ? 'animate-spin' : ''} />
          </button>
          <button onClick={exportCsv} className="neo-btn px-3 py-1.5 text-xs bg-[#111111] text-white font-mono font-bold flex items-center gap-1.5">
            <Download size={14} /> EXPORT CSV
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="neo-card p-4 bg-white">
          <div className="text-xs font-bold text-neutral-500 mb-1 font-mono uppercase">CAMPUS UTILIZATION</div>
          <div className="font-mono text-3xl font-black text-[#111111]">
            {kpisLoading ? '...' : `${kpis?.campus_utilization_pct ?? 0}%`}
          </div>
          <div className="text-[10px] text-neutral-500 font-mono mt-1">
            {kpis ? `${kpis.active_occupied_rooms} of ${kpis.total_classrooms} rooms active` : 'Active campus ratio'}
          </div>
        </div>

        <div className="neo-card p-4 bg-white">
          <div className="text-xs font-bold text-neutral-500 mb-1 font-mono uppercase">SCHEDULE ADHERENCE</div>
          <div className="font-mono text-3xl font-black text-[#2F6FDE]">
            {kpisLoading ? '...' : `${kpis?.schedule_adherence_pct ?? 0}%`}
          </div>
          <div className="text-[10px] text-neutral-500 font-mono mt-1">
            Classrooms strictly matching timetable
          </div>
        </div>

        <div className="neo-card p-4 bg-white">
          <div className="text-xs font-bold text-neutral-500 mb-1 font-mono uppercase">PEAK UTILIZATION HOUR</div>
          <div className="font-mono text-3xl font-black text-[#F2A900]">
            {kpisLoading ? '...' : (kpis?.peak_utilization_hour ?? '11:00 - 12:00')}
          </div>
          <div className="text-[10px] text-neutral-500 font-mono mt-1">
            Max concurrent timetable bookings
          </div>
        </div>
      </div>

      {/* Analytics Main Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hourly Utilization Recharts Curve */}
        <div className="neo-card p-5 bg-white space-y-3">
          <div className="flex items-center justify-between border-b-2 border-ink pb-2">
            <div className="flex items-center gap-2">
              <BarChart2 size={16} />
              <h2 className="font-heading font-black text-sm uppercase tracking-tight">
                Daily Utilization Curve (Hourly)
              </h2>
            </div>
            <span className="text-[10px] font-mono text-neutral-500">TODAY (IST)</span>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={curveData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorExpected" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2F6FDE" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#2F6FDE" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2F9E44" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#2F9E44" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="#111111" fontSize={11} fontFamily="IBM Plex Mono" />
                <YAxis stroke="#111111" fontSize={11} fontFamily="IBM Plex Mono" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    border: '2px solid #111111',
                    borderRadius: '2px',
                    boxShadow: '3px 3px 0 #111111',
                    fontFamily: 'IBM Plex Mono',
                    fontSize: '11px',
                  }}
                />
                <Legend wrapperStyle={{ fontFamily: 'IBM Plex Mono', fontSize: '11px', paddingTop: '8px' }} />
                <Area
                  type="monotone"
                  dataKey="expectedOccupied"
                  name="Timetable Scheduled"
                  stroke="#2F6FDE"
                  fillOpacity={1}
                  fill="url(#colorExpected)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="actualOccupied"
                  name="Live Occupied"
                  stroke="#2F9E44"
                  fillOpacity={1}
                  fill="url(#colorActual)"
                  strokeWidth={2.5}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Underutilized Rooms Table */}
        <div className="neo-card p-5 bg-white space-y-3">
          <div className="flex items-center justify-between border-b-2 border-ink pb-2">
            <div className="flex items-center gap-2">
              <TrendingDown size={16} className="text-amber-600" />
              <h2 className="font-heading font-black text-sm uppercase tracking-tight">
                Underutilized Rooms (&lt; 35% Capacity)
              </h2>
            </div>
            <span className="text-[10px] font-mono text-neutral-500">
              {underutilized.length} CANDIDATES
            </span>
          </div>

          <div className="overflow-x-auto max-h-72 overflow-y-auto">
            <table className="w-full text-left font-mono text-xs border border-neutral-200">
              <thead className="bg-[#F4F1EA] border-b border-ink sticky top-0">
                <tr>
                  <th className="p-2 border-r border-neutral-300">ROOM</th>
                  <th className="p-2 border-r border-neutral-300">NAME / FL</th>
                  <th className="p-2 border-r border-neutral-300">CAP</th>
                  <th className="p-2 border-r border-neutral-300">HOURS/WK</th>
                  <th className="p-2">UTIL %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {underutilized.map((r) => (
                  <tr key={r.id} className="hover:bg-neutral-50">
                    <td className="p-2 font-bold border-r border-neutral-200">
                      <Link to={`/classrooms/${r.id}`} className="hover:underline">
                        {r.id}
                      </Link>
                    </td>
                    <td className="p-2 text-neutral-600 truncate max-w-[130px] border-r border-neutral-200">
                      {r.name} (Fl {r.floor})
                    </td>
                    <td className="p-2 border-r border-neutral-200">{r.capacity}</td>
                    <td className="p-2 border-r border-neutral-200">{r.scheduled_weekly_hours}h</td>
                    <td className="p-2">
                      <span className="px-1.5 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 font-bold">
                        {r.weekly_utilization_pct}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[10px] font-mono text-neutral-500 pt-1">
            Surplus classroom capacity identified for master schedule rescheduling or energy cutbacks.
          </p>
        </div>
      </div>
    </div>
  );
};
