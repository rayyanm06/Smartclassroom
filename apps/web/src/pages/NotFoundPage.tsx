import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6">
      <div className="neo-card p-8 max-w-md w-full bg-white space-y-4">
        <div className="w-14 h-14 bg-[#D64545]/15 border-2 border-[#D64545] rounded-full flex items-center justify-center mx-auto text-[#D64545]">
          <AlertCircle size={28} />
        </div>
        <div className="font-mono text-4xl font-black">404</div>
        <h1 className="font-heading font-bold text-xl uppercase">Endpoint / Resource Not Found</h1>
        <p className="text-xs text-neutral-600 font-mono">
          The requested route does not map to any known physical classroom or system view.
        </p>
        <Link to="/" className="neo-btn w-full py-2.5 text-xs bg-[#111111] text-white">
          <ArrowLeft size={14} /> RETURN TO DASHBOARD
        </Link>
      </div>
    </div>
  );
};
