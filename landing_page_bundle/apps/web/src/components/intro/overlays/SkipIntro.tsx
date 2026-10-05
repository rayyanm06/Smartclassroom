import { useNavigate } from 'react-router-dom';
import { runDashboardTransition } from '../transition/dashboardTransition';

export function SkipIntro() {
  const navigate = useNavigate();

  const handleSkip = () => {
    runDashboardTransition(navigate);
  };

  return (
    <div className="fixed top-3 right-3 z-35 pointer-events-auto">
      <button
        type="button"
        onClick={handleSkip}
        className="lp-plate px-3 py-1.5 font-mono text-[11px] font-black uppercase tracking-wider text-[var(--lp-ink)] bg-white hover:bg-[var(--lp-yellow)] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
        aria-label="Skip introduction and proceed to dashboard"
      >
        <span>SKIP INTRO</span>
        <span className="text-xs">↗</span>
      </button>
    </div>
  );
}
