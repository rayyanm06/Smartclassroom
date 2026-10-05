import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { Zap, CheckCircle2, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';

export const EnergyPage: React.FC = () => {
  const queryClient = useQueryClient();

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['energy-recommendations'],
    queryFn: () => api.getEnergyRecommendations(),
    refetchInterval: 3000,
  });

  const applianceMutation = useMutation({
    mutationFn: ({
      roomId,
      device,
    }: {
      roomId: string;
      device: 'ac' | 'light';
    }) => api.dispatchApplianceAction(roomId, { device, command: 'off' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['energy-recommendations'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-classrooms'] });
    },
  });

  const recommendations = data?.recommendations ?? [];
  const totalWaste = data?.total_waste_kwh ?? 0.0;

  return (
    <div className="space-y-6">
      <div className="border-ink bg-white p-4 shadow-neo flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="neo-header-strip inline-block mb-2">ENERGY CONSERVATION · APPLIANCE ENGINE</span>
          <h1 className="text-2xl font-bold font-heading uppercase tracking-tight">Energy Recommendations</h1>
          <p className="text-sm text-neutral-600 font-mono">
            Automated waste detection with remote appliance override dispatch
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`font-mono text-xs px-3 py-1 font-bold border ${
            totalWaste > 0
              ? 'bg-amber-100 text-amber-900 border-amber-400'
              : 'bg-[#2F9E44]/15 text-[#2F9E44] border-[#2F9E44]'
          }`}>
            EST. CURRENT WASTE: ~{totalWaste} kWh
          </span>
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['energy-recommendations'] })}
            className="neo-btn p-1.5 text-xs bg-white"
            title="Refresh Recommendations"
          >
            <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="p-12 text-center font-mono text-xs bg-white border-2 border-ink">
          Evaluating live campus energy telemetry...
        </div>
      ) : recommendations.length === 0 ? (
        <div className="neo-card p-12 text-center bg-white space-y-3">
          <CheckCircle2 size={40} className="mx-auto text-[#2F9E44]" />
          <h2 className="font-heading font-black text-xl uppercase tracking-tight">ALL CLASSROOMS OPTIMIZED</h2>
          <p className="text-xs font-mono text-neutral-600 max-w-md mx-auto">
            No active energy waste detected. All empty classrooms have AC and lights shut down, or rooms are legitimately occupied.
          </p>
          <div className="pt-2">
            <Link to="/classrooms" className="neo-btn px-4 py-2 text-xs bg-[#111111] text-white font-mono">
              VIEW CLASSROOM INVENTORY
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {recommendations.map((rec) => (
            <div key={rec.classroom_id} className="neo-card p-5 border-l-8 border-l-[#D64545] bg-white">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b-2 border-ink pb-3 mb-3">
                <div className="flex items-center gap-3">
                  <Link
                    to={`/classrooms/${rec.classroom_id}`}
                    className="font-mono text-2xl font-black hover:underline"
                  >
                    {rec.classroom_id}
                  </Link>
                  <span className="text-xs text-neutral-500 font-mono">
                    Floor {rec.floor ?? 0} · Academic Block
                  </span>
                  <span className="px-2 py-0.5 bg-[#D64545] text-white font-mono text-[10px] font-bold uppercase">
                    {rec.severity} · {rec.idle_minutes} MIN IDLE
                  </span>
                </div>
                <div className="font-mono text-xs text-neutral-600">
                  Est. Wastage: <strong className="text-[#111111]">{rec.estimated_waste_kwh} kWh</strong>
                </div>
              </div>

              <p className="text-sm font-bold text-[#111111] mb-1">{rec.headline}</p>
              <p className="text-xs text-neutral-600 font-mono mb-4">{rec.context}</p>

              <div className="flex flex-wrap items-center gap-3">
                {rec.ac_status && (
                  <button
                    disabled={applianceMutation.isPending}
                    onClick={() =>
                      applianceMutation.mutate({ roomId: rec.classroom_id, device: 'ac' })
                    }
                    className="neo-btn px-3 py-1.5 text-xs bg-[#D64545] text-white font-mono font-bold flex items-center gap-1.5"
                  >
                    <Zap size={14} /> TURN OFF AC
                  </button>
                )}
                {rec.light_status && (
                  <button
                    disabled={applianceMutation.isPending}
                    onClick={() =>
                      applianceMutation.mutate({ roomId: rec.classroom_id, device: 'light' })
                    }
                    className="neo-btn px-3 py-1.5 text-xs bg-[#111111] text-white font-mono font-bold flex items-center gap-1.5"
                  >
                    <Zap size={14} /> TURN OFF LIGHTS
                  </button>
                )}
                <Link
                  to={`/classrooms/${rec.classroom_id}`}
                  className="neo-btn px-3 py-1.5 text-xs bg-white font-mono font-bold"
                >
                  VIEW UNIT SPEC
                </Link>
                <span className="text-[10px] text-neutral-500 font-mono ml-auto">
                  Commands queue in device_commands and apply to sensor simulator / ESP32
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
