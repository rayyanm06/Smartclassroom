import { createBrowserRouter } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { DashboardPage } from '../pages/DashboardPage';
import { ClassroomsPage } from '../pages/ClassroomsPage';
import { ClassroomDetailPage } from '../pages/ClassroomDetailPage';
import { CameraPage } from '../pages/CameraPage';
import { TimetablePage } from '../pages/TimetablePage';
import { EnergyPage } from '../pages/EnergyPage';
import { AnalyticsPage } from '../pages/AnalyticsPage';
import { PredictionsPage } from '../pages/PredictionsPage';
import { AlertsPage } from '../pages/AlertsPage';
import { ReportsPage } from '../pages/ReportsPage';
import { SettingsPage } from '../pages/SettingsPage';
import { WatchmanPage } from '../pages/WatchmanPage';
import { NotFoundPage } from '../pages/NotFoundPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'classrooms', element: <ClassroomsPage /> },
      { path: 'classrooms/:id', element: <ClassroomDetailPage /> },
      { path: 'camera', element: <CameraPage /> },
      { path: 'timetable', element: <TimetablePage /> },
      { path: 'energy', element: <EnergyPage /> },
      { path: 'analytics', element: <AnalyticsPage /> },
      { path: 'predictions', element: <PredictionsPage /> },
      { path: 'alerts', element: <AlertsPage /> },
      { path: 'reports', element: <ReportsPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  {
    path: '/watchman',
    element: <WatchmanPage />,
  },
]);
