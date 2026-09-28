import React from 'react';
import {
  LayoutDashboard,
  Users,
  CheckCircle2,
  CalendarCheck,
  HelpCircle,
  AlertTriangle,
  Zap,
  Video,
} from 'lucide-react';
import type { DashboardSummary } from '../../types';

interface KpiStripProps {
  summary: DashboardSummary;
}

export const KpiStrip: React.FC<KpiStripProps> = ({ summary }) => {
  const kpis = [
    {
      label: 'TOTAL ROOMS',
      value: summary.total_classrooms,
      subtext: `${summary.rooms_in_use_pct}% active in use`,
      icon: LayoutDashboard,
      color: 'text-[#111111]',
    },
    {
      label: 'OCCUPIED',
      value: summary.occupied_now,
      subtext: 'Verified presence',
      icon: Users,
      color: 'text-[#2F9E44]',
    },
    {
      label: 'EMPTY',
      value: summary.empty_now,
      subtext: 'Unoccupied rooms',
      icon: CheckCircle2,
      color: 'text-[#5F6368]',
    },
    {
      label: 'EXPECTED',
      value: summary.expected_now,
      subtext: 'Timetable scheduled',
      icon: CalendarCheck,
      color: 'text-[#2F6FDE]',
    },
    {
      label: 'UNEXPECTED',
      value: summary.unexpected_now,
      subtext: 'Ad-hoc occupancy',
      icon: HelpCircle,
      color: 'text-[#B27B00]',
    },
    {
      label: 'ANOMALIES',
      value: summary.anomalies,
      subtext: 'Class scheduled empty',
      icon: AlertTriangle,
      color: 'text-[#D64545]',
    },
    {
      label: 'ENERGY ALERTS',
      value: summary.energy_alerts,
      subtext: 'Appliances idle in empty',
      icon: Zap,
      color: 'text-[#D64545]',
    },
    {
      label: 'ACTIVE CAMERAS',
      value: summary.camera_feeds_active,
      subtext: `${summary.seat_utilization_pct}% camera seat util`,
      icon: Video,
      color: 'text-[#2F6FDE]',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
      {kpis.map((kpi, idx) => {
        const Icon = kpi.icon;
        return (
          <div
            key={idx}
            className="neo-card p-3 flex flex-col justify-between hover:translate-x-0.5 hover:translate-y-0.5 transition-all bg-white"
          >
            <div className="flex items-center justify-between text-neutral-500 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider font-heading truncate">
                {kpi.label}
              </span>
              <Icon size={14} className={kpi.color} />
            </div>
            <div className={`font-mono text-2xl font-black ${kpi.color}`}>
              {kpi.value}
            </div>
            <div className="text-[10px] text-neutral-500 mt-1 truncate font-mono">
              {kpi.subtext}
            </div>
          </div>
        );
      })}
    </div>
  );
};
