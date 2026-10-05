import React from 'react';
import { Play, Flame, Shield, User } from 'lucide-react';
import { ActiveTab } from './Sidebar';

interface HeaderProps {
  onStartDemo: () => void;
  onToggleStress: () => void;
  isStressed: boolean;
  setActiveTab: (tab: ActiveTab) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onStartDemo,
  onToggleStress,
  isStressed,
  setActiveTab,
}) => {
  return (
    <header className="fixed top-0 left-72 right-0 h-16 bg-[#0a0e16]/90 backdrop-blur-xl border-b border-[#262a33] shadow-[0_1px_8px_rgba(0,0,0,0.3)] z-40 flex items-center justify-between px-6 select-none">
      {/* Status Badges Group */}
      <div className="flex items-center gap-3">
        {/* Simulation Notice Badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400 font-mono text-[11px] font-semibold" title="Companion Web UI acts as an interactive prototype and visualizer for evaluation. Real driver operations run on native Linux.">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
          <span>DEMO SIMULATION</span>
        </div>

        {/* Kernel Module Status */}
        <div className="flex items-center gap-2 px-3 py-1 bg-[#1c2028] border border-[#262a33] rounded-lg">
          <span className="w-2 h-2 rounded-full bg-[#4edea3] animate-pulse"></span>
          <span className="font-mono text-[11px] font-semibold text-[#4edea3]">
            kernel_monitor.ko
          </span>
        </div>

        {/* C++ Daemon Status */}
        <div className="flex items-center gap-2 px-3 py-1 bg-[#1c2028] border border-[#262a33] rounded-lg">
          <span className="w-2 h-2 rounded-full bg-[#4cd7f6]"></span>
          <span className="font-mono text-[11px] font-semibold text-[#4cd7f6]">
            C++ DAEMON: RUNNING
          </span>
        </div>

        {/* Devfs Status */}
        <div className="flex items-center gap-2 px-3 py-1 bg-[#1c2028] border border-[#262a33] rounded-lg hidden sm:flex">
          <span className="w-2 h-2 rounded-full bg-[#4edea3]"></span>
          <span className="font-mono text-[11px] font-semibold text-[#dfe2ee]">
            DEVFS: CONNECTED
          </span>
        </div>

        {/* Device Health Status Shortcut */}
        <button
          onClick={() => setActiveTab('health')}
          className="flex items-center gap-2 px-3 py-1 bg-[#1c2028] hover:bg-[#262a33] border border-[#262a33] rounded-lg transition-colors cursor-pointer hidden md:flex"
          title="Open Device Health Monitor"
        >
          <span className="w-2 h-2 rounded-full bg-[#4edea3]"></span>
          <span className="font-mono text-[11px] font-semibold text-[#4edea3]">
            HEALTH: OPTIMAL
          </span>
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Interactive Load Injection Simulator */}
        <button
          onClick={onToggleStress}
          title="Inject synthetic load on CFS scheduler to trigger warnings in dmesg"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-medium transition-all ${
            isStressed
              ? 'bg-[#ffb4ab]/20 text-[#ffb4ab] border border-[#ffb4ab]/40 animate-pulse'
              : 'bg-[#1c2028] hover:bg-[#262a33] text-[#bbcabf] border border-[#262a33]'
          }`}
        >
          <Flame className={`w-3.5 h-3.5 ${isStressed ? 'text-[#ffb4ab]' : 'text-[#86948a]'}`} />
          <span>{isStressed ? 'Stress Active (Core #7 100%)' : 'Simulate Stress'}</span>
        </button>

        {/* Run Demo Launcher */}
        <button
          onClick={() => {
            setActiveTab('blueprint');
            onStartDemo();
          }}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#10b981] hover:bg-[#005236] text-[#002113] hover:text-[#4edea3] rounded font-mono text-xs font-semibold transition-all shadow-sm"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>5-10m Demo</span>
        </button>

        {/* Ring Sync Memory Address */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-[#181c24] border border-[#262a33] rounded-lg font-mono text-[11px]">
          <span className="text-[#86948a]">RING_SYNC:</span>
          <span className="text-[#4edea3] font-bold">0x8F4A_C000</span>
        </div>

        {/* Profile Icon */}
        <div className="w-8 h-8 rounded-full bg-[#4edea3] flex items-center justify-center text-[#003824]">
          <User className="w-4 h-4" />
        </div>
      </div>
    </header>
  );
};
