import React, { useState } from 'react';
import { 
  Cpu, 
  Search, 
  Terminal, 
  ShieldAlert, 
  Activity, 
  Hash, 
  Sliders, 
  RefreshCw,
  CheckCircle,
  Filter
} from 'lucide-react';
import { ProcessStat, IrqStat } from '../types/sysmonitor';

interface ProcessesIrqViewProps {
  onShowToast: (msg: string) => void;
  isStressed: boolean;
}

const INITIAL_PROCESSES: ProcessStat[] = [
  {
    pid: 1,
    ppid: 0,
    comm: 'systemd',
    state: 'TASK_INTERRUPTIBLE',
    cpuAffinity: '0xFF',
    prio: 120,
    vctx: 14201,
    ivctx: 312,
    rssKb: 14200,
    cpuPct: 0.1
  },
  {
    pid: 4892,
    ppid: 1204,
    comm: 'sysmonitor_daemon',
    state: 'TASK_RUNNING',
    cpuAffinity: '0xFF',
    prio: 110,
    vctx: 89402,
    ivctx: 14,
    rssKb: 4096,
    cpuPct: 0.8
  },
  {
    pid: 24,
    ppid: 2,
    comm: 'kworker/0:1H-kblockd',
    state: 'TASK_INTERRUPTIBLE',
    cpuAffinity: '0x01',
    prio: 100,
    vctx: 34102,
    ivctx: 0,
    rssKb: 0,
    cpuPct: 0.0
  },
  {
    pid: 5102,
    ppid: 4892,
    comm: 'stress-ng-cpu',
    state: 'TASK_RUNNING',
    cpuAffinity: '0x80', // Core 7
    prio: 120,
    vctx: 120,
    ivctx: 42190,
    rssKb: 8192,
    cpuPct: 98.4
  },
  {
    pid: 742,
    ppid: 1,
    comm: 'dbus-daemon',
    state: 'TASK_INTERRUPTIBLE',
    cpuAffinity: '0xFF',
    prio: 120,
    vctx: 8420,
    ivctx: 94,
    rssKb: 3820,
    cpuPct: 0.1
  },
  {
    pid: 891,
    ppid: 1,
    comm: 'NetworkManager',
    state: 'TASK_INTERRUPTIBLE',
    cpuAffinity: '0xFF',
    prio: 120,
    vctx: 12400,
    ivctx: 182,
    rssKb: 18400,
    cpuPct: 0.2
  },
  {
    pid: 1420,
    ppid: 2,
    comm: 'ksoftirqd/0',
    state: 'TASK_INTERRUPTIBLE',
    cpuAffinity: '0x01',
    prio: 120,
    vctx: 49102,
    ivctx: 1,
    rssKb: 0,
    cpuPct: 0.2
  },
  {
    pid: 1421,
    ppid: 2,
    comm: 'ksoftirqd/7',
    state: 'TASK_INTERRUPTIBLE',
    cpuAffinity: '0x80',
    prio: 120,
    vctx: 38204,
    ivctx: 1,
    rssKb: 0,
    cpuPct: 0.4
  }
];

const INITIAL_IRQS: IrqStat[] = [
  {
    vector: 0,
    name: 'IO-APIC 2-edge timer',
    type: 'Timer',
    affinityCpu: 0,
    countsPerCore: [489201, 1420, 1102, 940, 890, 820, 780, 910]
  },
  {
    vector: 48,
    name: 'PCI-MSI nvme0q1',
    type: 'PCI-MSI',
    affinityCpu: 3,
    countsPerCore: [120, 480, 310, 84920, 940, 110, 80, 140]
  },
  {
    vector: 52,
    name: 'PCI-MSI eth0-rx-0',
    type: 'PCI-MSI',
    affinityCpu: 2,
    countsPerCore: [90, 110, 142900, 240, 120, 80, 90, 100]
  },
  {
    vector: 240,
    name: 'sysmonitor-ring-wake',
    type: 'CharDev-KMod',
    affinityCpu: 7,
    countsPerCore: [489, 412, 460, 490, 510, 480, 520, 98402]
  },
  {
    vector: 251,
    name: 'Rescheduling interrupts (IPI)',
    type: 'IPI',
    affinityCpu: 0,
    countsPerCore: [19402, 18920, 17890, 19200, 18400, 18100, 17900, 24100]
  }
];

export const ProcessesIrqView: React.FC<ProcessesIrqViewProps> = ({ onShowToast, isStressed }) => {
  const [processes, setProcesses] = useState<ProcessStat[]>(INITIAL_PROCESSES);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [irqs, setIrqs] = useState<IrqStat[]>(INITIAL_IRQS);

  const filteredProcesses = processes.filter((p) => {
    if (!searchQuery.trim()) return true;
    return (
      p.comm.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.pid.toString().includes(searchQuery)
    );
  });

  const handleKillProcess = (pid: number) => {
    setProcesses((prev) => prev.filter((p) => p.pid !== pid));
    onShowToast(`Signal SIGTERM sent to PID ${pid}`);
  };

  return (
    <div className="flex flex-col w-full gap-6 select-text">
      {/* Top Banner: task_struct RCU Traversal */}
      <section className="bg-[#181c24] border border-[#262a33] rounded-xl p-5 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#4cd7f6]/10 border border-[#4cd7f6]/30 text-[#4cd7f6] flex items-center justify-center">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-base text-[#dfe2ee]">
                Process Scheduler &amp; task_struct RCU Inspector
              </h2>
              <span className="px-2 py-0.5 rounded bg-[#1c2028] border border-[#262a33] text-[#4edea3] font-mono text-xs">
                rcu_read_lock()
              </span>
            </div>
            <p className="text-xs text-[#bbcabf] mt-0.5">
              Lockless traversal of kernel <code className="font-mono text-[#4cd7f6]">for_each_process()</code> monitoring runqueues, context switch rates, and affinities
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-[#86948a]" />
            <input
              type="text"
              placeholder="Search comm or PID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#0a0e16] border border-[#262a33] text-[#dfe2ee] placeholder:text-[#86948a] font-mono text-xs pl-8 pr-3 py-1.5 rounded outline-none focus:border-[#4cd7f6] w-48"
            />
          </div>
        </div>
      </section>

      {/* Process Table */}
      <section className="bg-[#181c24] border border-[#262a33] rounded-xl p-5 shadow-md flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs uppercase tracking-wider text-[#86948a]">Active Tasks ({filteredProcesses.length})</span>
            <span className="text-[10px] text-[#4edea3] bg-[#10b981]/10 px-2 py-0.5 rounded font-mono">
              CFS Preemption Safe
            </span>
          </div>
          <span className="text-xs font-mono text-[#86948a]">
            sysmonitor_daemon PID: 4892 (Listening on /dev/sysmonitor)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-[#262a33] text-[#86948a] text-[11px]">
                <th className="py-2.5 px-3">PID</th>
                <th className="py-2.5 px-3">COMM</th>
                <th className="py-2.5 px-3">STATE</th>
                <th className="py-2.5 px-3">AFFINITY</th>
                <th className="py-2.5 px-3">VOLUNTARY CTX</th>
                <th className="py-2.5 px-3">INVOLUNTARY CTX</th>
                <th className="py-2.5 px-3">RSS (KB)</th>
                <th className="py-2.5 px-3">CPU %</th>
                <th className="py-2.5 px-3 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#262a33]/40">
              {filteredProcesses.map((proc) => {
                const isTarget = proc.comm.includes('sysmonitor');
                const isHog = proc.cpuPct > 50;
                return (
                  <tr key={proc.pid} className={`hover:bg-[#1c2028]/60 ${isTarget ? 'bg-[#4edea3]/5' : ''}`}>
                    <td className="py-2.5 px-3 text-[#dfe2ee] font-semibold">{proc.pid}</td>
                    <td className="py-2.5 px-3 flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${isTarget ? 'bg-[#4edea3]' : isHog ? 'bg-[#ffb4ab]' : 'bg-[#86948a]'}`}></span>
                      <span className={`${isTarget ? 'text-[#4edea3] font-bold' : isHog ? 'text-[#ffb4ab] font-bold' : 'text-[#dfe2ee]'}`}>
                        {proc.comm}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                        proc.state === 'TASK_RUNNING' ? 'bg-[#10b981]/20 text-[#4edea3]' : 'bg-[#31353e] text-[#bbcabf]'
                      }`}>
                        {proc.state}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-[#4cd7f6]">{proc.cpuAffinity}</td>
                    <td className="py-2.5 px-3 text-[#dfe2ee] tabular-nums">{proc.vctx.toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-[#bbcabf] tabular-nums">{proc.ivctx.toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-[#dfe2ee] tabular-nums">{proc.rssKb.toLocaleString()}</td>
                    <td className="py-2.5 px-3 font-bold tabular-nums">
                      <span className={isHog ? 'text-[#ffb4ab]' : 'text-[#dfe2ee]'}>
                        {proc.cpuPct.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {proc.pid !== 1 && proc.pid !== 4892 ? (
                        <button
                          onClick={() => handleKillProcess(proc.pid)}
                          className="text-[10px] px-2 py-0.5 bg-[#93000a]/20 hover:bg-[#93000a]/40 text-[#ffb4ab] border border-[#ffb4ab]/30 rounded transition-colors"
                        >
                          kill -9
                        </button>
                      ) : (
                        <span className="text-[10px] text-[#86948a]">Protected</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Hardware & Software IRQ Interrupt Vectors Table */}
      <section className="bg-[#181c24] border border-[#262a33] rounded-xl p-5 shadow-md flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Hash className="w-4 h-4 text-[#d0bcff]" />
            <h3 className="font-semibold text-base text-[#dfe2ee]">
              Hardware &amp; Driver IRQ Vector Distribution (/proc/interrupts)
            </h3>
          </div>
          <span className="text-xs font-mono text-[#4cd7f6]">
            PCI-MSI &amp; KMod Wakeup Vectors
          </span>
        </div>
        <p className="text-xs text-[#bbcabf]">
          Interrupt routing distribution across physical cores 0 through 7
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-[#262a33] text-[#86948a] text-[11px]">
                <th className="py-2 px-3">VECTOR</th>
                <th className="py-2 px-3">INTERRUPT NAME</th>
                <th className="py-2 px-3">TYPE</th>
                <th className="py-2 px-3">CPU0</th>
                <th className="py-2 px-3">CPU1</th>
                <th className="py-2 px-3">CPU2</th>
                <th className="py-2 px-3">CPU3</th>
                <th className="py-2 px-3">CPU4</th>
                <th className="py-2 px-3">CPU5</th>
                <th className="py-2 px-3">CPU6</th>
                <th className="py-2 px-3">CPU7</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#262a33]/40">
              {irqs.map((irq) => {
                const isKmod = irq.vector === 240;
                return (
                  <tr key={irq.vector} className={`hover:bg-[#1c2028]/60 ${isKmod ? 'bg-[#4edea3]/5' : ''}`}>
                    <td className="py-2.5 px-3 font-bold text-[#4cd7f6]">#{irq.vector}</td>
                    <td className="py-2.5 px-3">
                      <span className={isKmod ? 'text-[#4edea3] font-bold' : 'text-[#dfe2ee]'}>
                        {irq.name}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="text-[10px] bg-[#262a33] text-[#bbcabf] px-1.5 py-0.5 rounded">
                        {irq.type}
                      </span>
                    </td>
                    {irq.countsPerCore.map((cnt, idx) => (
                      <td key={idx} className="py-2.5 px-3 tabular-nums text-[#dfe2ee]">
                        {cnt.toLocaleString()}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
