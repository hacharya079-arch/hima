
import React from 'react';
import { Activity, Server, Globe, Shield } from 'lucide-react';

const DashboardHeader: React.FC = () => {
  return (
    <header className="bg-zinc-900/50 border-b border-zinc-800 backdrop-blur-xl sticky top-0 z-50 px-8 py-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600/20 rounded-lg">
            <Activity className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">StreamPulse VPS</h1>
            <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block"></span>
              Server Status: Operational
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6 overflow-x-auto pb-2 md:pb-0">
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-tighter">Region</span>
            <span className="text-sm font-medium flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-zinc-400" />
              US-East-1 (NY)
            </span>
          </div>
          <div className="flex flex-col items-end border-l border-zinc-800 pl-6">
            <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-tighter">Instance</span>
            <span className="text-sm font-medium flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-zinc-400" />
              4vCPU / 16GB RAM
            </span>
          </div>
          <div className="flex flex-col items-end border-l border-zinc-800 pl-6">
            <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-tighter">RTMP Port</span>
            <span className="text-sm font-medium flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-green-400" />
              1935 (Secure)
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
