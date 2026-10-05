import React from 'react';
import { 
  Activity, 
  Cpu, 
  Terminal, 
  Layers, 
  BookOpen, 
  Code2, 
  ShieldCheck, 
  HeartPulse,
  ExternalLink 
} from 'lucide-react';

export type ActiveTab = 'logs' | 'overview' | 'health' | 'chardev' | 'processes' | 'blueprint' | 'code';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenStackModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
}) => {
  return (
    <aside className="fixed left-0 top-0 h-full w-72 bg-[#0a0e16] z-50 flex flex-col justify-between border-r border-[#1c2028] shadow-[0_1px_8px_rgba(0,0,0,0.4)] select-none">
      <div className="flex flex-col">
        {/* Brand Header */}
        <div className="h-16 px-6 flex items-center gap-3 bg-[#181c24] border-b border-[#262a33]">
          <div className="w-8 h-8 rounded bg-[#10b981]/20 border border-[#10b981]/40 flex items-center justify-center text-[#4edea3]">
            <Activity className="w-5 h-5 text-[#4edea3]" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-base text-[#dfe2ee] tracking-tight leading-none">
              SysMonitor
            </span>
            <span className="font-mono text-[11px] text-[#4edea3] font-semibold tracking-normal mt-0.5">
              v2.4.11-kmod
            </span>
          </div>
        </div>

        {/* Subsystems Navigation */}
        <div className="px-4 py-3">
          <div className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[#86948a] px-2 mb-1.5">
            Subsystems
          </div>
          <nav className="flex flex-col gap-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors font-mono text-xs text-left ${
                activeTab === 'overview'
                  ? 'bg-[#262a33] text-[#4edea3] font-semibold border-l-2 border-[#4edea3]'
                  : 'text-[#bbcabf] hover:bg-[#1c2028] hover:text-[#dfe2ee]'
              }`}
            >
              <Activity className="w-[18px] h-[18px] shrink-0" />
              <span>Overview / Telemetry</span>
            </button>

            <button
              onClick={() => setActiveTab('health')}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors font-mono text-xs text-left ${
                activeTab === 'health'
                  ? 'bg-[#262a33] text-[#4edea3] font-semibold border-l-2 border-[#4edea3]'
                  : 'text-[#bbcabf] hover:bg-[#1c2028] hover:text-[#dfe2ee]'
              }`}
            >
              <HeartPulse className="w-[18px] h-[18px] shrink-0 text-[#4edea3]" />
              <span>Device Health Monitor</span>
            </button>

            <button
              onClick={() => setActiveTab('chardev')}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors font-mono text-xs text-left ${
                activeTab === 'chardev'
                  ? 'bg-[#262a33] text-[#4edea3] font-semibold border-l-2 border-[#4edea3]'
                  : 'text-[#bbcabf] hover:bg-[#1c2028] hover:text-[#dfe2ee]'
              }`}
            >
              <Layers className="w-[18px] h-[18px] shrink-0" />
              <span>Char Dev Interface</span>
            </button>

            <button
              onClick={() => setActiveTab('processes')}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors font-mono text-xs text-left ${
                activeTab === 'processes'
                  ? 'bg-[#262a33] text-[#4edea3] font-semibold border-l-2 border-[#4edea3]'
                  : 'text-[#bbcabf] hover:bg-[#1c2028] hover:text-[#dfe2ee]'
              }`}
            >
              <Cpu className="w-[18px] h-[18px] shrink-0" />
              <span>Processes &amp; IRQs</span>
            </button>

            <button
              onClick={() => setActiveTab('logs')}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors font-mono text-xs text-left ${
                activeTab === 'logs'
                  ? 'bg-[#262a33] text-[#4edea3] font-semibold border-l-2 border-[#4edea3]'
                  : 'text-[#bbcabf] hover:bg-[#1c2028] hover:text-[#dfe2ee]'
              }`}
            >
              <Terminal className="w-[18px] h-[18px] shrink-0" />
              <span>Logs &amp; Ring Buffer</span>
            </button>
          </nav>
        </div>

        {/* 15-Step Blueprint Navigation */}
        <div className="px-4 py-2">
          <div className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[#86948a] px-2 mb-1.5 flex items-center justify-between">
            <span>Project Blueprint</span>
            <span className="text-[10px] text-[#4cd7f6] bg-[#004e5c]/40 px-1.5 py-0.5 rounded">15 STEPS</span>
          </div>
          <nav className="flex flex-col gap-1">
            <button
              onClick={() => setActiveTab('blueprint')}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors font-mono text-xs text-left ${
                activeTab === 'blueprint'
                  ? 'bg-[#262a33] text-[#4edea3] font-semibold border-l-2 border-[#4edea3]'
                  : 'text-[#bbcabf] hover:bg-[#1c2028] hover:text-[#dfe2ee]'
              }`}
            >
              <BookOpen className="w-[18px] h-[18px] text-[#4cd7f6] shrink-0" />
              <div className="flex flex-col">
                <span>15-Step Guide &amp; Demo</span>
                <span className="text-[10px] text-[#86948a]">Step 1 to Step 15</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('code')}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors font-mono text-xs text-left ${
                activeTab === 'code'
                  ? 'bg-[#262a33] text-[#4edea3] font-semibold border-l-2 border-[#4edea3]'
                  : 'text-[#bbcabf] hover:bg-[#1c2028] hover:text-[#dfe2ee]'
              }`}
            >
              <Code2 className="w-[18px] h-[18px] text-[#d0bcff] shrink-0" />
              <span>Driver Source Inspector</span>
            </button>
          </nav>
        </div>

        {/* Kernel Topology Widget (Matching Screenshot) */}
        <div className="px-4 py-3">
          <div className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[#86948a] px-2 mb-1.5">
            Kernel Topology
          </div>
          <div className="bg-[#181c24] p-3 rounded-lg border border-[#262a33] flex flex-col gap-1 font-mono text-[11px]">
            <div className="flex justify-between items-center text-[#bbcabf]">
              <span>Node:</span>
              <span className="text-[#dfe2ee] font-mono text-xs font-semibold">/dev/sysmonitor</span>
            </div>
            <div className="flex justify-between items-center text-[#bbcabf]">
              <span>Major/Minor:</span>
              <span className="text-[#4cd7f6] font-mono text-xs font-semibold">240 / 0</span>
            </div>
            <div className="flex justify-between items-center text-[#bbcabf]">
              <span>Ring Buffer:</span>
              <span className="text-[#4edea3] font-mono text-xs font-semibold">1024 KB [OK]</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sysfs Uptime & IOCTL Latency Footer (Matching Screenshot) */}
      <div className="p-4 bg-[#181c24] border-t border-[#262a33]">
        <div className="flex items-center justify-between text-[#bbcabf] font-mono text-[11px] mb-1">
          <span>SYSFS UPTIME</span>
          <span className="text-[#dfe2ee] font-mono text-xs font-bold tabular-nums">14d 08:22:19</span>
        </div>
        <div className="flex items-center justify-between text-[#bbcabf] font-mono text-[11px]">
          <span>IOCTL LATENCY</span>
          <span className="text-[#4edea3] font-mono text-xs font-bold tabular-nums">1.42 μs</span>
        </div>
      </div>
    </aside>
  );
};
