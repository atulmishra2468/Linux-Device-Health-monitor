import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Cpu, 
  HardDrive, 
  Zap, 
  Flame, 
  RotateCw, 
  ArrowUpRight, 
  Gauge, 
  Layers, 
  Sparkles,
  ShieldCheck,
  Server
} from 'lucide-react';
import { CpuCoreStat, MemoryStat } from '../types/sysmonitor';
import { useVisibilityInterval } from '../hooks/useVisibilityInterval';

interface OverviewTelemetryViewProps {
  isStressed: boolean;
  onToggleStress: () => void;
  onShowToast: (msg: string) => void;
}

const INITIAL_CORES: CpuCoreStat[] = Array.from({ length: 8 }, (_, i) => ({
  coreId: i,
  freqMHz: 3800 + Math.floor(Math.random() * 200),
  userPct: i === 7 ? 12 : Math.floor(8 + Math.random() * 10),
  sysPct: Math.floor(4 + Math.random() * 6),
  iowaitPct: Math.floor(Math.random() * 3),
  irqPct: 1,
  idlePct: 80,
  tempC: 42 + Math.floor(Math.random() * 6)
}));

export const OverviewTelemetryView: React.FC<OverviewTelemetryViewProps> = ({
  isStressed,
  onToggleStress,
  onShowToast,
}) => {
  const [cores, setCores] = useState<CpuCoreStat[]>(INITIAL_CORES);
  const [ioctlLatency, setIoctlLatency] = useState<number>(1.42);
  const [benchmarking, setBenchmarking] = useState<boolean>(false);
  const [loadAvg, setLoadAvg] = useState<[number, number, number]>([0.42, 0.38, 0.25]);
  const [cswRate, setCswRate] = useState<number>(4210);

  // Dynamic telemetry tick paused when tab is hidden
  useVisibilityInterval(() => {
    setCores((prev) =>
      prev.map((c) => {
        let user = isStressed && c.coreId >= 4 ? 94 + Math.floor(Math.random() * 6) : Math.floor(6 + Math.random() * 12);
        let sys = isStressed ? Math.floor(12 + Math.random() * 8) : Math.floor(3 + Math.random() * 5);
        let idle = Math.max(0, 100 - user - sys - c.iowaitPct - c.irqPct);
        let freq = isStressed ? 4200 : 3800 + Math.floor(Math.random() * 150);
        let temp = isStressed ? 68 + Math.floor(Math.random() * 5) : 44 + Math.floor(Math.random() * 4);
        return {
          ...c,
          userPct: user,
          sysPct: sys,
          idlePct: idle,
          freqMHz: freq,
          tempC: temp
        };
      })
    );
    setLoadAvg([
      parseFloat((isStressed ? 3.42 + Math.random() * 0.4 : 0.42 + Math.random() * 0.08).toFixed(2)),
      parseFloat((isStressed ? 2.85 + Math.random() * 0.3 : 0.38 + Math.random() * 0.05).toFixed(2)),
      0.25
    ]);
    setCswRate(isStressed ? 18450 + Math.floor(Math.random() * 1200) : 4210 + Math.floor(Math.random() * 250));
  }, 1000);

  const runBenchmark = () => {
    setBenchmarking(true);
    setTimeout(() => {
      setBenchmarking(false);
      const measured = 1.38 + Math.random() * 0.08;
      setIoctlLatency(parseFloat(measured.toFixed(2)));
      onShowToast(`Driver round-trip benchmark: ${measured.toFixed(2)} μs average`);
    }, 800);
  };

  const avgCpu = Math.round(
    cores.reduce((acc, c) => acc + (100 - c.idlePct), 0) / cores.length
  );

  return (
    <div className="flex flex-col w-full gap-6 select-text">
      {/* Simulation / UI Prototype Disclaimer Banner */}
      <div className="px-4 py-3 bg-amber-500/10 border border-amber-500/25 rounded-xl flex items-center justify-between text-xs text-amber-300 font-mono">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0"></span>
          <span>
            <strong>UI Mockup & Telemetry Simulation:</strong> Browser charts and latency are simulated to evaluate the monitoring interface design. Live hardware metrics are collected on Linux by running <code>./monitor</code> and <code>/dev/sysmonitor</code>.
          </span>
        </div>
      </div>

      {/* Top Telemetry KPI Row */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Overall CPU Utilization */}
        <div className="bg-[#181c24] border border-[#262a33] rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#86948a] font-mono text-xs">
            <span className="uppercase">Aggregate CPU Load</span>
            <Cpu className="w-4 h-4 text-[#4edea3]" />
          </div>
          <div className="flex items-baseline gap-2 my-2">
            <span className="font-mono text-3xl font-bold text-[#dfe2ee] tabular-nums">
              {avgCpu}%
            </span>
            <span className="font-mono text-xs text-[#86948a]">8 Cores active</span>
          </div>
          <div className="w-full bg-[#1c2028] h-2 rounded-full overflow-hidden border border-[#262a33]">
            <div
              className={`h-full transition-all duration-500 ${
                avgCpu > 70 ? 'bg-[#ffb4ab]' : 'bg-[#4edea3]'
              }`}
              style={{ width: `${avgCpu}%` }}
            ></div>
          </div>
          <div className="flex justify-between items-center text-[11px] font-mono text-[#bbcabf] mt-2">
            <span>kstat_cpu() tick</span>
            <span className="text-[#4edea3]">100 Hz Sync</span>
          </div>
        </div>

        {/* Memory & Slab Usage */}
        <div className="bg-[#181c24] border border-[#262a33] rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#86948a] font-mono text-xs">
            <span className="uppercase">RAM &amp; Kernel Slab</span>
            <HardDrive className="w-4 h-4 text-[#4cd7f6]" />
          </div>
          <div className="flex items-baseline gap-2 my-2">
            <span className="font-mono text-3xl font-bold text-[#4cd7f6] tabular-nums">
              8.42
            </span>
            <span className="font-mono text-xs text-[#bbcabf]">/ 32.0 GB</span>
          </div>
          <div className="w-full bg-[#1c2028] h-2 rounded-full overflow-hidden border border-[#262a33]">
            <div className="h-full bg-[#4cd7f6] transition-all duration-500" style={{ width: '26.3%' }}></div>
          </div>
          <div className="flex justify-between items-center text-[11px] font-mono text-[#bbcabf] mt-2">
            <span>Kernel Slab Active</span>
            <span className="text-[#4cd7f6]">128 MB (sysmon: 16KB)</span>
          </div>
        </div>

        {/* IOCTL Round-trip Latency */}
        <div className="bg-[#181c24] border border-[#262a33] rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#86948a] font-mono text-xs">
            <span className="uppercase">VFS IOCTL Round-trip</span>
            <Zap className="w-4 h-4 text-[#4edea3]" />
          </div>
          <div className="flex items-baseline gap-2 my-2">
            <span className="font-mono text-3xl font-bold text-[#4edea3] tabular-nums">
              {ioctlLatency.toFixed(2)}
            </span>
            <span className="font-mono text-xs text-[#bbcabf]">μs (SYSMON_GET_CPU)</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] text-[#4edea3]">Zero-copy lockless ring</span>
            <button
              onClick={runBenchmark}
              disabled={benchmarking}
              className="text-[10px] font-mono bg-[#1c2028] hover:bg-[#262a33] text-[#4cd7f6] px-2 py-0.5 rounded border border-[#262a33] transition-colors"
            >
              {benchmarking ? 'Testing...' : 'Benchmark'}
            </button>
          </div>
          <div className="flex justify-between items-center text-[11px] font-mono text-[#bbcabf] mt-2">
            <span>Throughput</span>
            <span className="text-[#dfe2ee]">704,225 ops/sec</span>
          </div>
        </div>

        {/* CFS Scheduler State */}
        <div className="bg-[#181c24] border border-[#262a33] rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#86948a] font-mono text-xs">
            <span className="uppercase">CFS Load Averages</span>
            <Activity className="w-4 h-4 text-[#d0bcff]" />
          </div>
          <div className="flex items-baseline gap-2 my-2">
            <span className="font-mono text-2xl font-bold text-[#d0bcff] tabular-nums">
              {loadAvg[0].toFixed(2)}, {loadAvg[1].toFixed(2)}, {loadAvg[2].toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between items-center text-[11px] font-mono text-[#bbcabf]">
            <span>cswitch rate:</span>
            <span className="text-[#dfe2ee] font-bold">{cswRate} /s</span>
          </div>
          <div className="flex justify-between items-center text-[11px] font-mono text-[#bbcabf] mt-2">
            <span>Preemption check</span>
            <span className="text-[#4edea3]">OOM hook active</span>
          </div>
        </div>
      </section>

      {/* 8-Core CPU Matrix */}
      <section className="bg-[#181c24] border border-[#262a33] rounded-xl p-5 shadow-md flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-base text-[#dfe2ee]">
                Per-Core Hardware Performance Counters (kstat_cpu)
              </h2>
              <span className="px-2 py-0.5 rounded bg-[#1c2028] border border-[#262a33] text-[#4edea3] font-mono text-xs">
                SMP 8T Topology
              </span>
            </div>
            <p className="text-xs text-[#bbcabf] mt-0.5">
              Direct CPU register cache sampling via <code className="font-mono text-[#4cd7f6]">kcpustat_cpu_fetch()</code> exposed through IOCTL 0x80047302
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onToggleStress}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-medium transition-all ${
                isStressed
                  ? 'bg-[#ffb4ab]/20 text-[#ffb4ab] border border-[#ffb4ab]/40 animate-pulse'
                  : 'bg-[#1c2028] hover:bg-[#262a33] text-[#bbcabf] border border-[#262a33]'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>{isStressed ? 'Stop Load Injection' : 'Inject 4-Core Stress (stress-ng)'}</span>
            </button>
          </div>
        </div>

        {/* Cores Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {cores.map((core) => {
            const usagePct = 100 - core.idlePct;
            const isHot = usagePct > 80;
            return (
              <div
                key={core.coreId}
                className="bg-[#1c2028] border border-[#262a33] rounded-lg p-3 flex flex-col gap-2 relative overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${isHot ? 'bg-[#ffb4ab] animate-pulse' : 'bg-[#4edea3]'}`}></span>
                    <span className="font-mono text-xs font-bold text-[#dfe2ee]">
                      Core #{core.coreId}
                    </span>
                  </div>
                  <span className="font-mono text-[11px] text-[#86948a]">
                    {core.freqMHz} MHz
                  </span>
                </div>

                <div className="flex items-baseline justify-between">
                  <span className="font-mono text-xl font-bold text-[#dfe2ee] tabular-nums">
                    {usagePct}%
                  </span>
                  <span className="font-mono text-[11px] text-[#bbcabf]">
                    {core.tempC}°C
                  </span>
                </div>

                {/* Segmented bar for User vs Sys */}
                <div className="w-full bg-[#0a0e16] h-2 rounded-full overflow-hidden flex border border-[#262a33]/60">
                  <div
                    className="bg-[#4edea3] h-full transition-all duration-300"
                    style={{ width: `${core.userPct}%` }}
                    title={`User: ${core.userPct}%`}
                  ></div>
                  <div
                    className="bg-[#4cd7f6] h-full transition-all duration-300"
                    style={{ width: `${core.sysPct}%` }}
                    title={`System: ${core.sysPct}%`}
                  ></div>
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-[#86948a] pt-1 border-t border-[#262a33]/40">
                  <span>usr: {core.userPct}%</span>
                  <span>sys: {core.sysPct}%</span>
                  <span>idle: {core.idlePct}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Memory Allocator & Kernel Slab Inspector */}
      <section className="grid grid-cols-12 gap-4 items-stretch">
        {/* Slab Allocations Table */}
        <div className="col-span-12 lg:col-span-7 bg-[#181c24] border border-[#262a33] rounded-xl p-5 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#4cd7f6]" />
                <h3 className="font-semibold text-base text-[#dfe2ee]">
                  Kernel SLAB / SLUB Cache Inventory
                </h3>
              </div>
              <span className="font-mono text-xs text-[#4edea3]">0 kmemleak alerts</span>
            </div>
            <p className="text-xs text-[#bbcabf] mb-4">
              Real-time slab descriptor allocations mapped from <code className="font-mono text-[#4cd7f6]">/proc/slabinfo</code>
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-[#262a33] text-[#86948a] text-[11px]">
                    <th className="py-2 px-2">SLAB CACHE</th>
                    <th className="py-2 px-2">OBJECTS</th>
                    <th className="py-2 px-2">OBJ SIZE</th>
                    <th className="py-2 px-2">TOTAL CACHED</th>
                    <th className="py-2 px-2">UTILIZATION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#262a33]/40">
                  <tr className="hover:bg-[#1c2028]/50">
                    <td className="py-2 px-2 text-[#4edea3] font-semibold">sysmonitor_ring_cache</td>
                    <td className="py-2 px-2 text-[#dfe2ee]">64</td>
                    <td className="py-2 px-2 text-[#bbcabf]">4,096 B</td>
                    <td className="py-2 px-2 text-[#dfe2ee]">256 KiB</td>
                    <td className="py-2 px-2 text-[#4edea3]">100% (Pinned)</td>
                  </tr>
                  <tr className="hover:bg-[#1c2028]/50">
                    <td className="py-2 px-2 text-[#4cd7f6]">kmalloc-512</td>
                    <td className="py-2 px-2 text-[#dfe2ee]">1,280</td>
                    <td className="py-2 px-2 text-[#bbcabf]">512 B</td>
                    <td className="py-2 px-2 text-[#dfe2ee]">640 KiB</td>
                    <td className="py-2 px-2 text-[#bbcabf]">88.4%</td>
                  </tr>
                  <tr className="hover:bg-[#1c2028]/50">
                    <td className="py-2 px-2 text-[#dfe2ee]">dentry</td>
                    <td className="py-2 px-2 text-[#dfe2ee]">48,190</td>
                    <td className="py-2 px-2 text-[#bbcabf]">192 B</td>
                    <td className="py-2 px-2 text-[#dfe2ee]">9.25 MiB</td>
                    <td className="py-2 px-2 text-[#bbcabf]">96.1%</td>
                  </tr>
                  <tr className="hover:bg-[#1c2028]/50">
                    <td className="py-2 px-2 text-[#dfe2ee]">inode_cache</td>
                    <td className="py-2 px-2 text-[#dfe2ee]">32,410</td>
                    <td className="py-2 px-2 text-[#bbcabf]">608 B</td>
                    <td className="py-2 px-2 text-[#dfe2ee]">19.7 MiB</td>
                    <td className="py-2 px-2 text-[#bbcabf]">94.2%</td>
                  </tr>
                  <tr className="hover:bg-[#1c2028]/50">
                    <td className="py-2 px-2 text-[#dfe2ee]">buffer_head</td>
                    <td className="py-2 px-2 text-[#dfe2ee]">18,940</td>
                    <td className="py-2 px-2 text-[#bbcabf]">104 B</td>
                    <td className="py-2 px-2 text-[#dfe2ee]">1.97 MiB</td>
                    <td className="py-2 px-2 text-[#bbcabf]">91.0%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#262a33] flex items-center justify-between text-xs font-mono text-[#bbcabf]">
            <span>Continuous Memory: DMA32 &amp; Normal Zones</span>
            <span className="text-[#4edea3]">0 Fragmented Orders</span>
          </div>
        </div>

        {/* Ring Buffer Shared Memory Visualizer */}
        <div className="col-span-12 lg:col-span-5 bg-[#181c24] border border-[#262a33] rounded-xl p-5 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-base text-[#dfe2ee]">
                Lockless Ring Buffer Memory Map
              </h3>
              <span className="font-mono text-xs text-[#4cd7f6] bg-[#004e5c]/30 px-2 py-0.5 rounded">
                ORDER 4 (64 PAGES)
              </span>
            </div>
            <p className="text-xs text-[#bbcabf] mb-4">
              Direct physical page mapping between <code className="font-mono text-[#4edea3]">sysmonitor.ko</code> and <code className="font-mono text-[#4cd7f6]">sysmonitor_daemon</code>
            </p>

            {/* Virtual Memory Visualizer */}
            <div className="space-y-3 font-mono text-xs">
              <div className="bg-[#0a0e16] p-3 rounded-lg border border-[#262a33] space-y-2">
                <div className="flex justify-between items-center text-[#86948a] text-[11px]">
                  <span>KERNEL VIRTUAL ADDRESS</span>
                  <span className="text-[#4edea3]">0xffff888104e82000</span>
                </div>
                <div className="flex justify-between items-center text-[#86948a] text-[11px]">
                  <span>USERLAND MMAP VIRTUAL</span>
                  <span className="text-[#4cd7f6]">0x7f83a21b3000</span>
                </div>
                <div className="flex justify-between items-center text-[#86948a] text-[11px]">
                  <span>PAGE FRAME NUMBER (PFN)</span>
                  <span className="text-[#dfe2ee]">0x104e82</span>
                </div>
              </div>

              {/* Progress Bar of Ring Capacity */}
              <div className="bg-[#1c2028] p-3 rounded-lg border border-[#262a33]">
                <div className="flex justify-between items-center mb-1 text-[11px]">
                  <span className="text-[#86948a]">RING UTILIZATION</span>
                  <span className="text-[#4edea3] font-bold">164.3 / 256.0 KiB (64.2%)</span>
                </div>
                <div className="w-full bg-[#0a0e16] h-3 rounded-full overflow-hidden border border-[#262a33]">
                  <div className="bg-gradient-to-r from-[#4edea3] to-[#4cd7f6] h-full" style={{ width: '64.2%' }}></div>
                </div>
                <div className="flex justify-between items-center text-[10px] text-[#86948a] mt-1.5">
                  <span>Head: 0x2e40</span>
                  <span>Tail: 0x1d20</span>
                  <span className="text-[#4edea3]">Drops: 0</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 p-2.5 bg-[#1c2028] border border-[#262a33] rounded-lg flex items-center gap-2 text-xs font-mono text-[#4edea3]">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>Memory isolation validated: Non-root userland cannot overflow kernel ring</span>
          </div>
        </div>
      </section>
    </div>
  );
};
