import React from 'react';
import { Link } from 'react-router-dom';
import type { Alert } from '../../types';
import { SEVERITY_STYLES } from '../../lib/styles';
import { AlertOctagon, ArrowRight, CheckCircle2 } from 'lucide-react';

interface AttentionPanelProps {
  alerts: Alert[];
  onAcknowledge?: (alertId: string | number) => void;
  onResolve?: (alertId: string | number) => void;
}

export const AttentionPanel: React.FC<AttentionPanelProps> = ({
  alerts,
  onAcknowledge,
  onResolve,
}) => {
  const openAlerts = alerts.filter((a) => a.status !== 'resolved').slice(0, 5);

  return (
    <div className="neo-card p-4 space-y-3 bg-white">
      <div className="flex items-center justify-between border-b-2 border-ink pb-2">
        <div className="flex items-center gap-2">
          <AlertOctagon size={16} className="text-[#D64545]" />
          <h3 className="font-heading font-black text-sm uppercase tracking-tight">
            Attention Required
          </h3>
        </div>
        <span className="px-2 py-0.5 bg-[#D64545] text-white font-mono text-[10px] font-bold">
          {openAlerts.length} OPEN
        </span>
      </div>

      {openAlerts.length === 0 ? (
        <div className="p-6 text-center text-neutral-500 font-mono text-xs space-y-1">
          <CheckCircle2 size={24} className="mx-auto text-[#2F9E44]" />
          <p className="font-bold text-[#111111]">ALL CLEAR</p>
          <p className="text-[10px]">No active incidents requiring immediate intervention.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {openAlerts.map((alert) => {
            const sev = SEVERITY_STYLES[alert.severity];
            return (
              <div
                key={alert.id}
                className="p-2.5 border-2 border-ink bg-[#F4F1EA] space-y-2 shadow-neo-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs bg-white px-1.5 py-0.5 border border-ink">
                    {alert.classroom_id}
                  </span>
                  <span
                    className={`px-1.5 py-0.5 text-[9px] font-bold uppercase font-mono ${sev.bg} ${sev.text}`}
                  >
                    {sev.label}
                  </span>
                </div>

                <div>
                  <div className="font-bold text-xs text-[#111111] leading-tight">
                    {alert.headline}
                  </div>
                  <div className="text-[10px] text-neutral-600 font-mono mt-0.5">
                    {alert.detail}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-neutral-300">
                  <button
                    onClick={() => onAcknowledge?.(alert.id)}
                    className="text-[10px] font-mono font-bold text-neutral-600 hover:text-black hover:underline"
                  >
                    [ ACKNOWLEDGE ]
                  </button>
                  <button
                    onClick={() => onResolve?.(alert.id)}
                    className="text-[10px] font-mono font-bold text-[#D64545] hover:underline"
                  >
                    [ RESOLVE ]
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="pt-2 border-t border-neutral-200">
        <Link
          to="/alerts"
          className="text-xs font-mono font-bold text-[#111111] hover:underline flex items-center justify-between"
        >
          <span>VIEW ALL CAMPUS ALERTS</span>
          <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
};
