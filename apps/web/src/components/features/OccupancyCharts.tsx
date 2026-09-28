import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  BarChart,
  Bar,
} from 'recharts';
import type { OccupancyCurvePoint, BlockAvgTemp } from '../../types';

interface OccupancyChartsProps {
  curveData: OccupancyCurvePoint[];
  tempData: BlockAvgTemp[];
}

export const OccupancyCharts: React.FC<OccupancyChartsProps> = ({
  curveData,
  tempData,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* 2/3: Occupancy Expected vs Actual */}
      <div className="lg:col-span-2 neo-card p-4 bg-white space-y-3">
        <div className="flex items-center justify-between border-b-2 border-ink pb-2">
          <div>
            <span className="text-[10px] font-mono font-bold text-neutral-500 block">
              DIURNAL OCCUPANCY PATTERNS
            </span>
            <h3 className="font-heading font-black text-sm uppercase tracking-tight">
              Today's Occupancy vs Timetable Expected (Hourly)
            </h3>
          </div>
          <span className="text-xs font-mono bg-neutral-100 px-2 py-0.5 border border-neutral-300">
            CAMPUS METRIC
          </span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={curveData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
              <XAxis
                dataKey="time"
                stroke="#111111"
                fontSize={11}
                tickLine={false}
                fontFamily="IBM Plex Mono"
              />
              <YAxis
                stroke="#111111"
                fontSize={11}
                tickLine={false}
                fontFamily="IBM Plex Mono"
              />
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
              <Legend
                wrapperStyle={{
                  paddingTop: '10px',
                  fontFamily: 'IBM Plex Mono',
                  fontSize: '11px',
                }}
              />
              <Line
                type="monotone"
                dataKey="expectedOccupied"
                name="Timetable Expected"
                stroke="#2F6FDE"
                strokeWidth={2}
                dot={{ r: 3, stroke: '#111111', strokeWidth: 1 }}
              />
              <Line
                type="monotone"
                dataKey="actualOccupied"
                name="Actual Occupied"
                stroke="#2F9E44"
                strokeWidth={2.5}
                dot={{ r: 4, stroke: '#111111', strokeWidth: 1.5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 1/3: Avg Temperature by Block */}
      <div className="neo-card p-4 bg-white space-y-3">
        <div className="flex items-center justify-between border-b-2 border-ink pb-2">
          <div>
            <span className="text-[10px] font-mono font-bold text-neutral-500 block">
              ENVIRONMENT SENSORS
            </span>
            <h3 className="font-heading font-black text-sm uppercase tracking-tight">
              Avg Temperature by Block
            </h3>
          </div>
          <span className="text-xs font-mono bg-neutral-100 px-2 py-0.5 border border-neutral-300">
            °C (DHT11)
          </span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={tempData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <XAxis
                dataKey="block"
                stroke="#111111"
                fontSize={11}
                tickLine={false}
                fontFamily="IBM Plex Mono"
              />
              <YAxis
                stroke="#111111"
                fontSize={11}
                domain={[20, 35]}
                tickLine={false}
                fontFamily="IBM Plex Mono"
              />
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
              <Bar
                dataKey="temp"
                name="Avg Temp (°C)"
                fill="#111111"
                stroke="#111111"
                strokeWidth={1}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
