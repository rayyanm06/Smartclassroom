import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  DoorClosed,
  Video,
  Calendar,
  Zap,
  BarChart3,
  BrainCircuit,
  Bell,
  FileText,
  Settings,
  ShieldAlert,
  Menu,
  X,
  Radio,
} from 'lucide-react';

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/classrooms', label: 'Classrooms', icon: DoorClosed },
  { path: '/camera', label: 'Camera Feed', icon: Video },
  { path: '/timetable', label: 'Timetable', icon: Calendar },
  { path: '/energy', label: 'Energy', icon: Zap },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/predictions', label: 'Predictions', icon: BrainCircuit },
  { path: '/alerts', label: 'Alerts', icon: Bell },
  { path: '/reports', label: 'Reports', icon: FileText },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export const NavRail: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile Top Bar */}
      <header className="md:hidden border-b-2 border-ink bg-[#FFFFFF] p-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-[#111111]" />
          <span className="font-heading font-black text-sm tracking-tight">SMART CLASSROOM</span>
        </div>
        <div className="flex items-center gap-2">
          <NavLink
            to="/watchman"
            className="neo-btn px-2 py-1 text-[11px] bg-[#F2C94C] text-[#111111] font-bold"
          >
            WATCHMAN
          </NavLink>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-1 border-ink bg-[#F4F1EA]"
            aria-label="Toggle Navigation"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Mobile Dropdown Menu */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-x-0 top-[53px] bottom-0 bg-[#F4F1EA] border-b-2 border-ink z-50 p-4 overflow-y-auto space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 border-2 text-sm font-bold uppercase transition-all ${
                    isActive
                      ? 'bg-[#111111] text-white border-ink shadow-neo-sm'
                      : 'bg-white text-neutral-800 border-ink hover:bg-neutral-100'
                  }`
                }
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      )}

      {/* Desktop Left Sidebar / NavRail */}
      <aside className="hidden md:flex flex-col w-64 border-r-2 border-ink bg-[#FFFFFF] min-h-screen shrink-0 sticky top-0 h-screen overflow-y-auto">
        {/* Brand Header */}
        <div className="p-4 border-b-2 border-ink">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-4 h-4 bg-[#111111]" />
            <span className="font-mono text-xs font-bold text-neutral-500 uppercase tracking-wider">
              FACILITY MGMT V1
            </span>
          </div>
          <h1 className="font-heading font-black text-lg uppercase tracking-tight text-[#111111]">
            Smart Classroom
          </h1>
          <div className="flex items-center gap-1.5 mt-2">
            <Radio size={12} className="text-[#2F9E44] animate-pulse" />
            <span className="font-mono text-[10px] text-neutral-600">FUSION ENGINE · ONLINE</span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1.5 flex-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 text-xs font-bold uppercase transition-all border-2 ${
                    isActive
                      ? 'bg-[#111111] text-[#F4F1EA] border-ink shadow-neo-sm'
                      : 'border-transparent text-neutral-700 hover:border-ink hover:bg-[#F4F1EA]'
                  }`
                }
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Watchman Mode Link at bottom */}
        <div className="p-3 border-t-2 border-ink bg-[#F4F1EA]">
          <NavLink
            to="/watchman"
            className="neo-btn w-full py-2 text-xs bg-[#F2C94C] text-[#111111] font-bold border-ink shadow-neo-sm flex items-center justify-center gap-2"
          >
            <ShieldAlert size={16} />
            <span>WATCHMAN MODE</span>
          </NavLink>
          <div className="text-[10px] font-mono text-center text-neutral-500 mt-2">
            Timezone: Asia/Kolkata (IST)
          </div>
        </div>
      </aside>
    </>
  );
};
