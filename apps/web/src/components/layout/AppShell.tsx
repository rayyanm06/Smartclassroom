import React from 'react';
import { Outlet } from 'react-router-dom';
import { NavRail } from './NavRail';

export const AppShell: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#F4F1EA] text-[#111111]">
      <NavRail />
      <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
};
