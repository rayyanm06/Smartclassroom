import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Activity, Thermometer, Wind, Zap } from 'lucide-react';

export const ClassroomDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link to="/classrooms" className="neo-btn px-2.5 py-1 text-xs">
          <ArrowLeft size={14} /> BACK TO DIRECTORY
        </Link>
      </div>

      <div className="border-ink bg-white p-4 shadow-neo flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="neo-header-strip inline-block mb-2">CLASSROOM TELEMETRY · UNIT SPEC</span>
          <h1 className="text-3xl font-bold font-mono tracking-tight">{id || 'ROOM'}</h1>
          <p className="text-sm text-neutral-600">Physical classroom state, sensor fusion evidence, and appliance controls</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 bg-[#2F9E44] text-white font-mono text-sm font-bold border-2 border-ink">
            OCCUPIED
          </span>
          <span className="px-2 py-1 bg-neutral-100 border border-ink text-xs font-mono">
            CONFIDENCE: HIGH
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="neo-card p-4">
          <div className="flex items-center gap-2 text-xs font-bold text-neutral-500 mb-2">
            <Thermometer size={16} /> TEMPERATURE
          </div>
          <div className="font-mono text-2xl font-bold">26°C</div>
          <div className="text-[10px] text-neutral-500">Sensor: DHT11 (Quantised)</div>
        </div>

        <div className="neo-card p-4">
          <div className="flex items-center gap-2 text-xs font-bold text-neutral-500 mb-2">
            <Wind size={16} /> HUMIDITY
          </div>
          <div className="font-mono text-2xl font-bold">58%</div>
          <div className="text-[10px] text-neutral-500">Relative Humidity</div>
        </div>

        <div className="neo-card p-4">
          <div className="flex items-center gap-2 text-xs font-bold text-neutral-500 mb-2">
            <Activity size={16} /> MOTION (PIR)
          </div>
          <div className="font-mono text-2xl font-bold text-[#2F9E44]">ACTIVE</div>
          <div className="text-[10px] text-neutral-500">Last motion: 2m ago</div>
        </div>

        <div className="neo-card p-4">
          <div className="flex items-center gap-2 text-xs font-bold text-neutral-500 mb-2">
            <Zap size={16} /> APPLIANCES
          </div>
          <div className="font-mono text-lg font-bold">AC: ON · LIGHT: ON</div>
          <div className="text-[10px] text-neutral-500">Power: 1.8 kW rated</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="neo-card p-5">
          <h2 className="font-heading font-bold text-lg uppercase border-b-2 border-ink pb-2 mb-3">
            Fusion Evidence Trail
          </h2>
          <ul className="space-y-2 text-xs font-mono">
            <li className="p-2 bg-neutral-50 border border-neutral-300">
              [CAMERA] Count: {id === 'A101' ? '7 persons detected' : 'N/A (No camera installed)'}
            </li>
            <li className="p-2 bg-neutral-50 border border-neutral-300">
              [PIR] Motion event logged within fresh window (30s)
            </li>
            <li className="p-2 bg-neutral-50 border border-neutral-300">
              [TIMETABLE] DBMS Lecture scheduled (10:00 - 11:00 IST)
            </li>
          </ul>
        </div>

        <div className="neo-card p-5">
          <h2 className="font-heading font-bold text-lg uppercase border-b-2 border-ink pb-2 mb-3">
            Manual Appliance Override
          </h2>
          <p className="text-xs text-neutral-600 mb-4">
            Dispatches queued command via <code className="bg-neutral-100 px-1 border border-neutral-300">device_commands</code>. Device acks on polling cycle.
          </p>
          <div className="flex flex-wrap gap-3">
            <button className="neo-btn px-4 py-2 text-xs bg-[#D64545] text-white">
              TURN OFF AC
            </button>
            <button className="neo-btn px-4 py-2 text-xs bg-[#111111] text-white">
              TURN OFF LIGHTS
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
