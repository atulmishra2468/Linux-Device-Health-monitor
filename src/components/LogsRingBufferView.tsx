import React, { useState, useEffect, useRef } from 'react';
import { 
  Terminal, 
  Copy, 
  Download, 
  FileCode2, 
  CheckCircle, 
  Bug, 
  Cpu, 
  Search, 
  ArrowDownToLine, 
  Pause, 
  Play, 
  RotateCcw,
  ShieldCheck,
  Check
} from 'lucide-react';
import { KernelLog, Subsystem } from '../types/sysmonitor';
import { useVisibilityInterval } from '../hooks/useVisibilityInterval';

interface LogsRingBufferViewProps {
  onOpenStackModal: () => void;
  onShowToast: (msg: string) => void;
  isStressed: boolean;
}

const INITIAL_LOGS: KernelLog[] = [
  {
    id: 'l1',
    timestamp: 1419.082100,
    level: 'INFO',
    subsystem: 'sched',
    message: 'SMP: CFS bandwidth runtime throttled: 0 tasks affected on CPU#2'
  },
  {
    id: 'l2',
    timestamp: 1419.410940,
    level: 'INFO',
    subsystem: 'sysmonitor',
    message: 'circular telemetry ring buffer flush: write_ptr=0x2e40, read_ptr=0x2e40, 0 drops'
  },
  {
    id: 'l3',
    timestamp: 1419.890012,
    level: 'DEBUG',
    subsystem: 'irq',
    message: 'vector 48 (PCI-MSI: nvme0q1) re-affinity assigned to CPU 3 mask 0x08'
  },
  {
    id: 'l4',
    timestamp: 1420.001923,
    level: 'NOTICE',
    subsystem: 'net',
    message: 'eth0: link enters UP state 10000 Mbps full duplex, tx-flow-control disabled'
  },
  {
    id: 'l5',
    timestamp: 1420.210450,
    level: 'INFO',
    subsystem: 'mm',
    message: 'compact_zone: order-3 allocation success on Node 0 Normal zone (12 pages migrated)'
  },
  {
    id: 'l6',
    timestamp: 1420.312940,
    level: 'WARNING',
    subsystem: 'sched',
    message: 'process 5102 (stress-ng-cpu) monopolizing CPU 7 runtime > 1800ms without preempt'
  },
  {
    id: 'l7',
    timestamp: 1420.392104,
    level: 'INFO',
    subsystem: 'sysmonitor',
    message: 'userland daemon poll tick sync ok; memory overhead: 384 KiB kernel slab allocated'
  },
  {
    id: 'l8',
    timestamp: 1420.500201,
    level: 'DEBUG',
    subsystem: 'sysmonitor',
    message: 'trace_event captured: sched_switch prev_comm=kworker/0:1 next_comm=sysmonitor_d'
  },
  {
    id: 'l9',
    timestamp: 1420.899201,
    level: 'ERR',
    subsystem: 'net',
    message: 'rx packet descriptor checksum validation failed on veth09a1f (dropped)'
  },
  {
    id: 'l10',
    timestamp: 1421.100910,
    level: 'INFO',
    subsystem: 'sysmonitor',
    message: 'driver heartbeat: loadavg [0.42, 0.38, 0.25], nr_running: 2, cswitch_rate: 4210/s'
  },
  {
    id: 'l11',
    timestamp: 1421.690873,
    level: 'INFO',
    subsystem: 'sysmonitor',
    message: 'dynamic sample gathered: slab_active=128kB, ioctl_q_depth=0'
  }
];

export const LogsRingBufferView: React.FC<LogsRingBufferViewProps> = ({
  onOpenStackModal,
  onShowToast,
  isStressed,
}) => {
  const [logs, setLogs] = useState<KernelLog[]>(INITIAL_LOGS);
  const [selectedSubsystem, setSelectedSubsystem] = useState<Subsystem>('all');
  const [selectedLevel, setSelectedLevel] = useState<string>('ALL');
  const [regexQuery, setRegexQuery] = useState<string>('');
  const [isAutoScroll, setIsAutoScroll] = useState<boolean>(true);
  const [isStreamPaused, setIsStreamPaused] = useState<boolean>(false);
  const [copiedDriver, setCopiedDriver] = useState<boolean>(false);

  const terminalRef = useRef<HTMLDivElement>(null);
  const lastTimeRef = useRef<number>(1421.75);

  // Auto-scroll effect
  useEffect(() => {
    if (isAutoScroll && terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs, isAutoScroll]);

  // Real-time simulated kernel ticks (paused when tab hidden or paused by user)
  useVisibilityInterval(() => {
    lastTimeRef.current += Math.random() * 0.4 + 0.15;
    const ts = parseFloat(lastTimeRef.current.toFixed(6));

    const possibleEvents: { sub: Subsystem; lvl: KernelLog['level']; msg: string }[] = isStressed
      ? [
          { sub: 'sched', lvl: 'WARNING', msg: 'CFS bandwidth throttle engaged on Core #7 (stress load high)' },
          { sub: 'sysmonitor', lvl: 'INFO', msg: 'write request received from userland test process' },
          { sub: 'mm', lvl: 'INFO', msg: 'kswapd0: memory watermark maintained, slab pressure nominal' },
          { sub: 'sysmonitor', lvl: 'DEBUG', msg: 'mutex_lock acquired: protected kernel_buffer transfer' }
        ]
      : [
          { sub: 'sysmonitor', lvl: 'INFO', msg: 'periodic driver heartbeat confirmed: SEQ #' + Math.floor(418900 + Math.random() * 200) },
          { sub: 'sched', lvl: 'DEBUG', msg: 'load_balance: cpu 2 pulls 0 tasks from idle cpu 5' },
          { sub: 'sysmonitor', lvl: 'INFO', msg: 'copy_to_user: read request served from /dev/sysmonitor' },
          { sub: 'mm', lvl: 'INFO', msg: 'kswapd0: zone high watermark maintained, 0 pages reclaimed' }
        ];

    const item = possibleEvents[Math.floor(Math.random() * possibleEvents.length)];
    const newEntry: KernelLog = {
      id: 'dyn_' + Date.now() + Math.random(),
      timestamp: ts,
      level: item.lvl,
      subsystem: item.sub,
      message: item.msg
    };

    setLogs((prev) => [...prev.slice(-90), newEntry]);
  }, isStreamPaused ? null : 3800);

  // Filter logs
  const filteredLogs = logs.filter((log) => {
    // Subsystem filter
    if (selectedSubsystem !== 'all' && log.subsystem !== selectedSubsystem) {
      return false;
    }

    // Level filter
    if (selectedLevel === 'CRIT' && !['EMERG', 'ALERT', 'CRIT'].includes(log.level)) {
      return false;
    }
    if (selectedLevel === 'ERR' && log.level !== 'ERR') {
      return false;
    }
    if (selectedLevel === 'WARNING' && log.level !== 'WARNING') {
      return false;
    }
    if (selectedLevel === 'INFO_NOTICE' && !['INFO', 'NOTICE'].includes(log.level)) {
      return false;
    }
    if (selectedLevel === 'DEBUG' && log.level !== 'DEBUG') {
      return false;
    }

    // Regex / text search
    if (regexQuery.trim()) {
      try {
        const regex = new RegExp(regexQuery.trim(), 'i');
        const lineText = `[${log.timestamp.toFixed(6)}] ${log.level} ${log.subsystem}: ${log.message}`;
        return regex.test(lineText);
      } catch (e) {
        return log.message.toLowerCase().includes(regexQuery.toLowerCase());
      }
    }

    return true;
  });

  const handleCopyDriverLogs = () => {
    const driverLines = [
      '[ 142.105420 ] KERN_INFO sysmonitor: module loaded with major 240, device class \'sysmon_class\'',
      '[ 142.105811 ] KERN_INFO sysmonitor: allocated circular ring buffer at 0xffff888104e82000 (order 4, 64 pages)',
      '[ 142.106200 ] KERN_INFO sysmonitor: registered character device /dev/sysmonitor [dev_t 0xf000000]',
      '[ 143.002194 ] KERN_NOTICE sysmonitor: user-space daemon (pid: 4892, sysmonitor_daemon) connected via open()',
      '[ 143.012890 ] KERN_INFO sysmonitor: ioctl 0x80047301 executed successfully (client pid 4892, arg: SYNC_RING_MAP)',
      '[ 145.200112 ] KERN_INFO sysmonitor: health check tick OK - 8 cores active, 0 OOM kills detected, slab cached'
    ].join('\n');

    navigator.clipboard.writeText(driverLines);
    setCopiedDriver(true);
    onShowToast('Copied 6 sysmonitor driver log lines to clipboard');
    setTimeout(() => setCopiedDriver(false), 2000);
  };

  const handleDownloadDump = () => {
    const dumpLines = [
      '=== Linux Kernel Ring Buffer Dump (SysMonitor v2.4.11-kmod) ===',
      'Uptime: 14d 08:22:19 | Major: 240 | Ring: 1024 KB | Status: TAINT_NONE',
      ...logs.map((l) => `[ ${l.timestamp.toFixed(6)} ] KERN_${l.level} ${l.subsystem}: ${l.message}`)
    ].join('\n');

    const blob = new Blob([dumpLines], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dmesg-sysmonitor-${Date.now()}.dump.log`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onShowToast('dmesg dump file generated');
  };

  const handleExportJson = () => {
    const payload = {
      subsystem: 'sysmonitor',
      kmod_version: '2.4.11-kmod',
      exported_at: new Date().toISOString(),
      kernel: {
        ring_buffer_kib: 1024,
        capacity_utilized_pct: 64.2,
        oops_count: 0,
        panic_count: 0,
        soft_lockups: 0,
        kmemleak_leaks: 0,
        slab_corruptions: 0
      },
      driver_logs: logs
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kernel-telemetry-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onShowToast('Telemetry JSON exported');
  };

  const handleClearView = () => {
    setLogs([
      {
        id: 'cleared_' + Date.now(),
        timestamp: lastTimeRef.current,
        level: 'INFO',
        subsystem: 'all',
        message: 'console view reset by operator - listening to /dev/kmsg live stream'
      }
    ]);
    onShowToast('dmesg buffer view reset');
  };

  // Helper for badge color
  const getLevelBadge = (level: KernelLog['level']) => {
    switch (level) {
      case 'ERR':
      case 'CRIT':
      case 'ALERT':
      case 'EMERG':
        return 'bg-[#93000a]/30 text-[#ffb4ab] border border-[#ffb4ab]/30';
      case 'WARNING':
        return 'bg-[#03b5d3]/20 text-[#4cd7f6] border border-[#4cd7f6]/30';
      case 'NOTICE':
        return 'bg-[#4cd7f6]/10 text-[#4cd7f6]';
      case 'DEBUG':
        return 'bg-[#31353e] text-[#bbcabf]';
      case 'INFO':
      default:
        return 'bg-[#10b981]/10 text-[#4edea3]';
    }
  };

  const getSubsystemColor = (sub: Subsystem) => {
    switch (sub) {
      case 'sysmonitor':
        return 'text-[#4edea3] font-semibold';
      case 'sched':
      case 'mm':
      case 'net':
        return 'text-[#4cd7f6] font-semibold';
      case 'irq':
      case 'vfs':
      default:
        return 'text-[#86948a] font-semibold';
    }
  };

  return (
    <div className="flex flex-col w-full gap-6 select-text">
      {/* Top Telemetry Banner & Fault Diagnostics Grid (Replicating Image 1) */}
      <section className="grid grid-cols-12 gap-4 items-stretch">
        {/* Left: printk & Ring Buffer Inspection */}
        <div className="col-span-12 xl:col-span-8 bg-[#181c24] border border-[#262a33] rounded-xl p-5 flex flex-col justify-between shadow-md relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-12 -translate-y-8 w-64 h-64 bg-[#4edea3]/5 rounded-full blur-3xl pointer-events-none"></div>

          <div>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#262a33] flex items-center justify-center text-[#4edea3]">
                  <Terminal className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-lg text-[#dfe2ee]">
                      printk &amp; Ring Buffer Inspection
                    </span>
                    <span className="px-2 py-0.5 bg-[#10b981]/10 text-[#4edea3] font-mono text-[11px] rounded">
                      klogctl::SYSLOG_ACTION_READ_ALL
                    </span>
                  </div>
                  <p className="text-xs text-[#bbcabf] mt-0.5">
                    Live streaming kernel message queue mapped via{' '}
                    <code className="font-mono text-[#4cd7f6]">/dev/kmsg</code> and{' '}
                    <code className="font-mono text-[#4cd7f6]">sysmonitor.ko</code> internal log slab
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyDriverLogs}
                  className="px-3 py-1.5 bg-[#1c2028] hover:bg-[#262a33] text-[#dfe2ee] border border-[#262a33] rounded font-mono text-xs transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  {copiedDriver ? <Check className="w-3.5 h-3.5 text-[#4edea3]" /> : <Copy className="w-3.5 h-3.5 text-[#4cd7f6]" />}
                  <span>{copiedDriver ? 'Copied' : 'Copy driver logs'}</span>
                </button>

                <button
                  onClick={handleDownloadDump}
                  className="px-3 py-1.5 bg-[#1c2028] hover:bg-[#262a33] text-[#dfe2ee] border border-[#262a33] rounded font-mono text-xs transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <Download className="w-3.5 h-3.5 text-[#4edea3]" />
                  <span>dmesg.dump</span>
                </button>

                <button
                  onClick={handleExportJson}
                  className="px-3 py-1.5 bg-[#10b981] hover:bg-[#005236] text-[#002113] hover:text-[#4edea3] rounded font-mono text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-md"
                >
                  <FileCode2 className="w-3.5 h-3.5" />
                  <span>Export JSON</span>
                </button>
              </div>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-[#262a33]/60">
              <div className="bg-[#1c2028] border border-[#262a33] rounded-lg p-3 flex flex-col">
                <span className="font-mono text-[10px] text-[#86948a] uppercase tracking-wider">
                  Ring Buffer Size
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="font-mono text-2xl font-bold text-[#dfe2ee] tabular-nums">
                    1,024
                  </span>
                  <span className="font-mono text-xs text-[#bbcabf]">KiB (dmesg)</span>
                </div>
                <span className="font-mono text-[11px] text-[#4edea3] mt-1 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3] animate-ping"></span>
                  Capacity: 64.2% utilized
                </span>
              </div>

              <div className="bg-[#1c2028] border border-[#262a33] rounded-lg p-3 flex flex-col">
                <span className="font-mono text-[10px] text-[#86948a] uppercase tracking-wider">
                  Driver Syslog Tick
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="font-mono text-2xl font-bold text-[#4cd7f6] tabular-nums">
                    100
                  </span>
                  <span className="font-mono text-xs text-[#bbcabf]">Hz</span>
                </div>
                <span className="font-mono text-[11px] text-[#bbcabf] mt-1">
                  Seq counter: #418,902
                </span>
              </div>

              <div className="bg-[#1c2028] border border-[#262a33] rounded-lg p-3 flex flex-col">
                <span className="font-mono text-[10px] text-[#86948a] uppercase tracking-wider">
                  printk Dropped
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="font-mono text-2xl font-bold text-[#4edea3] tabular-nums">
                    0
                  </span>
                  <span className="font-mono text-xs text-[#bbcabf]">msgs</span>
                </div>
                <span className="font-mono text-[11px] text-[#4edea3] mt-1">
                  Lossless ring lockup
                </span>
              </div>

              <div className="bg-[#1c2028] border border-[#262a33] rounded-lg p-3 flex flex-col">
                <span className="font-mono text-[10px] text-[#86948a] uppercase tracking-wider">
                  Module State
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="font-mono text-xl font-bold text-[#4edea3]">
                    TAINT_NONE
                  </span>
                </div>
                <span className="font-mono text-[11px] text-[#bbcabf] mt-1">
                  sysmonitor: in-tree GPL
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Kernel Fault Diagnostics (Image 1) */}
        <div className="col-span-12 xl:col-span-4 bg-[#181c24] border border-[#262a33] rounded-xl p-5 flex flex-col justify-between shadow-md relative overflow-hidden">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-xs uppercase tracking-wider text-[#86948a]">
                Kernel Fault Diagnostics
              </span>
              <span className="px-2 py-0.5 rounded bg-[#10b981]/20 text-[#4edea3] font-mono text-[11px]">
                SYS_HEALTH: OPTIMAL
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between p-2.5 bg-[#1c2028] border border-[#262a33] rounded">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#4edea3]"></span>
                  <span className="font-mono text-xs text-[#dfe2ee]">Kernel Oops / Panics</span>
                </div>
                <span className="font-mono text-xs font-bold text-[#4edea3]">0 DETECTED</span>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-[#1c2028] border border-[#262a33] rounded">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#4edea3]"></span>
                  <span className="font-mono text-xs text-[#dfe2ee]">Soft / Hard Lockups</span>
                </div>
                <span className="font-mono text-xs font-bold text-[#4edea3]">0 (NMI OK)</span>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-[#1c2028] border border-[#262a33] rounded">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#4cd7f6]"></span>
                  <span className="font-mono text-xs text-[#dfe2ee]">kmemleak Scan (sysmonitor)</span>
                </div>
                <span className="font-mono text-xs font-bold text-[#4cd7f6]">0 LEAKS (16KB)</span>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-[#1c2028] border border-[#262a33] rounded">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#4edea3]"></span>
                  <span className="font-mono text-xs text-[#dfe2ee]">SLAB / SLUB Corruptions</span>
                </div>
                <span className="font-mono text-xs font-bold text-[#4edea3]">CLEAN</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-2">
            <button
              onClick={onOpenStackModal}
              className="w-full py-2 bg-[#1c2028] hover:bg-[#262a33] border border-[#262a33] text-[#4cd7f6] hover:text-[#dfe2ee] rounded font-mono text-xs transition-colors flex items-center justify-center gap-2"
            >
              <Bug className="w-3.5 h-3.5" />
              <span>Simulate / Inspect Kernel Stack Verification</span>
            </button>
          </div>
        </div>
      </section>

      {/* Dedicated Driver Log Showcase Section (sysmonitor.ko) (Image 1) */}
      <section className="bg-[#181c24] border border-[#262a33] rounded-xl p-5 shadow-md flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-[#4edea3]/10 border border-[#4edea3]/30 text-[#4edea3] flex items-center justify-center">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-semibold text-base text-[#dfe2ee] flex items-center gap-2">
                <span>Target Driver Stream:</span>
                <span className="text-[#4edea3] font-mono">sysmonitor.ko</span>
              </h2>
              <p className="text-xs text-[#bbcabf]">
                Isolated driver ring buffer extracted via dynamic debug instrumentation &amp;{' '}
                <code className="font-mono text-[#4cd7f6]">dev_info()</code> prints
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-[#bbcabf] font-mono text-xs">
              <span className="w-2 h-2 rounded-full bg-[#4edea3] animate-pulse"></span>
              KMOD_HOOK: /sys/kernel/debug/sysmonitor
            </span>
            <div className="h-4 w-px bg-[#262a33]"></div>
            <span className="text-[#4cd7f6] font-mono text-xs font-semibold">
              Ring: 0xffff888104e82000
            </span>
          </div>
        </div>

        {/* Specialized Driver Card Strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-[#1c2028] border border-[#262a33] rounded-lg p-3 flex flex-col gap-1">
            <span className="font-mono text-[10px] text-[#86948a] uppercase">LIFECYCLE HOOK</span>
            <span className="font-mono text-xs font-bold text-[#4edea3]">module_init()</span>
            <p className="text-xs text-[#bbcabf] leading-relaxed">
              Allocated major number 240, devfs node <code className="font-mono text-[#dfe2ee]">/dev/sysmonitor</code> created with 0660 root:sysmon permissions.
            </p>
          </div>

          <div className="bg-[#1c2028] border border-[#262a33] rounded-lg p-3 flex flex-col gap-1">
            <span className="font-mono text-[10px] text-[#86948a] uppercase">INTERCONNECT</span>
            <span className="font-mono text-xs font-bold text-[#4cd7f6]">IOCTL &amp; MMAP</span>
            <p className="text-xs text-[#bbcabf] leading-relaxed">
              Direct memory mapping lock achieved. Zero-copy ring queue sync operational at 1.42 μs round-trip userland tick.
            </p>
          </div>

          <div className="bg-[#1c2028] border border-[#262a33] rounded-lg p-3 flex flex-col gap-1">
            <span className="font-mono text-[10px] text-[#86948a] uppercase">HEURISTICS</span>
            <span className="font-mono text-xs font-bold text-[#d0bcff]">Scheduler &amp; OOM Hook</span>
            <p className="text-xs text-[#bbcabf] leading-relaxed">
              Active kprobes attached to <code className="font-mono text-[#dfe2ee]">out_of_memory()</code> and <code className="font-mono text-[#dfe2ee]">finish_task_switch()</code> without latency regression.
            </p>
          </div>
        </div>

        {/* Driver Logs Terminal Block (The exact 6 calls from Image 1) */}
        <div className="bg-[#0a0e16] border border-[#1c2028] rounded-lg p-3 overflow-x-auto shadow-inner">
          <div className="flex items-center justify-between text-[#86948a] font-mono text-[11px] mb-2 border-b border-[#1c2028] pb-1.5">
            <span>DRIVER PRINTK CIRCULAR BUFFER (LAST 6 CALLS)</span>
            <span className="text-[#4edea3] font-mono font-semibold">TAG: sysmonitor</span>
          </div>
          <div className="space-y-1 font-mono text-xs leading-relaxed text-[#dfe2ee]">
            <div className="flex items-baseline gap-3">
              <span className="text-[#86948a] shrink-0">[ 142.105420 ]</span>
              <span className="px-1.5 py-0.5 rounded bg-[#10b981]/10 text-[#4edea3] text-[10px] shrink-0">KERN_INFO</span>
              <span className="text-[#4edea3] font-semibold shrink-0">sysmonitor:</span>
              <span>module loaded with major 240, device class 'sysmon_class'</span>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-[#86948a] shrink-0">[ 142.105811 ]</span>
              <span className="px-1.5 py-0.5 rounded bg-[#10b981]/10 text-[#4edea3] text-[10px] shrink-0">KERN_INFO</span>
              <span className="text-[#4edea3] font-semibold shrink-0">sysmonitor:</span>
              <span>allocated circular ring buffer at <code className="text-[#4cd7f6]">0xffff888104e82000</code> (order 4, 64 pages)</span>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-[#86948a] shrink-0">[ 142.106200 ]</span>
              <span className="px-1.5 py-0.5 rounded bg-[#10b981]/10 text-[#4edea3] text-[10px] shrink-0">KERN_INFO</span>
              <span className="text-[#4edea3] font-semibold shrink-0">sysmonitor:</span>
              <span>registered character device /dev/sysmonitor [dev_t 0xf000000]</span>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-[#86948a] shrink-0">[ 143.002194 ]</span>
              <span className="px-1.5 py-0.5 rounded bg-[#4cd7f6]/10 text-[#4cd7f6] text-[10px] shrink-0">KERN_NOTICE</span>
              <span className="text-[#4edea3] font-semibold shrink-0">sysmonitor:</span>
              <span>user-space daemon (pid: 4892, sysmonitor_daemon) connected via open()</span>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-[#86948a] shrink-0">[ 143.012890 ]</span>
              <span className="px-1.5 py-0.5 rounded bg-[#10b981]/10 text-[#4edea3] text-[10px] shrink-0">KERN_INFO</span>
              <span className="text-[#4edea3] font-semibold shrink-0">sysmonitor:</span>
              <span>ioctl 0x80047301 executed successfully (client pid 4892, arg: SYNC_RING_MAP)</span>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-[#86948a] shrink-0">[ 145.200112 ]</span>
              <span className="px-1.5 py-0.5 rounded bg-[#10b981]/10 text-[#4edea3] text-[10px] shrink-0">KERN_INFO</span>
              <span className="text-[#4edea3] font-semibold shrink-0">sysmonitor:</span>
              <span>health check tick OK - 8 cores active, 0 OOM kills detected, slab cached</span>
            </div>
          </div>
        </div>
      </section>

      {/* Live Kernel Ring Buffer Console (dmesg) Stream (Image 1) */}
      <section className="bg-[#181c24] border border-[#262a33] rounded-xl p-5 shadow-md flex flex-col gap-4">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-base text-[#dfe2ee]">
                Live Kernel Ring Buffer Console
              </h2>
              <span className="px-2 py-0.5 rounded bg-[#1c2028] border border-[#262a33] text-[#bbcabf] font-mono text-xs">
                {filteredLogs.length} events shown
              </span>
            </div>
            <p className="text-xs text-[#bbcabf] mt-0.5">
              Real-time dmesg capture with log-level categorization, subsystem regex sorting, and dynamic auto-scroll
            </p>
          </div>

          {/* Controls & Filters Bar */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Subsystem tabs */}
            <div className="flex items-center bg-[#1c2028] border border-[#262a33] rounded p-0.5">
              {(['all', 'sysmonitor', 'sched', 'mm', 'irq', 'net'] as Subsystem[]).map((sub) => (
                <button
                  key={sub}
                  onClick={() => setSelectedSubsystem(sub)}
                  className={`px-2 py-1 rounded font-mono text-xs transition-colors ${
                    selectedSubsystem === sub
                      ? 'bg-[#262a33] text-[#4edea3] font-semibold shadow-sm'
                      : 'text-[#bbcabf] hover:text-[#dfe2ee]'
                  }`}
                >
                  {sub}
                </button>
              ))}
            </div>

            {/* Log Level Select */}
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="bg-[#1c2028] border border-[#262a33] text-[#dfe2ee] font-mono text-xs px-2.5 py-1.5 rounded outline-none focus:border-[#4cd7f6] cursor-pointer"
            >
              <option value="ALL">All Levels (0-7)</option>
              <option value="CRIT">KERN_EMERG - CRIT (0-2)</option>
              <option value="ERR">KERN_ERR (3)</option>
              <option value="WARNING">KERN_WARNING (4)</option>
              <option value="INFO_NOTICE">KERN_NOTICE &amp; INFO (5-6)</option>
              <option value="DEBUG">KERN_DEBUG (7)</option>
            </select>

            {/* Search regex */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-[#86948a]" />
              <input
                type="text"
                placeholder="grep regex..."
                value={regexQuery}
                onChange={(e) => setRegexQuery(e.target.value)}
                className="bg-[#1c2028] border border-[#262a33] text-[#dfe2ee] placeholder:text-[#86948a] font-mono text-xs pl-8 pr-3 py-1.5 rounded outline-none focus:border-[#4cd7f6] w-40"
              />
            </div>

            {/* Auto-scroll switch */}
            <button
              onClick={() => setIsAutoScroll(!isAutoScroll)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 bg-[#1c2028] border border-[#262a33] font-mono text-xs rounded transition-colors ${
                isAutoScroll ? 'text-[#4edea3]' : 'text-[#86948a]'
              }`}
            >
              <ArrowDownToLine className="w-3.5 h-3.5" />
              <span>Scroll: {isAutoScroll ? 'ON' : 'OFF'}</span>
            </button>

            {/* Stream pause toggle */}
            <button
              onClick={() => setIsStreamPaused(!isStreamPaused)}
              className={`flex items-center gap-1 px-2.5 py-1.5 bg-[#1c2028] border border-[#262a33] font-mono text-xs rounded transition-colors ${
                isStreamPaused ? 'text-[#ffb4ab]' : 'text-[#bbcabf]'
              }`}
            >
              {isStreamPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
              <span>{isStreamPaused ? 'Resume' : 'Pause'}</span>
            </button>

            {/* Clear buffer */}
            <button
              onClick={handleClearView}
              className="px-2.5 py-1.5 bg-[#1c2028] hover:bg-[#262a33] border border-[#262a33] text-[#ffb4ab] font-mono text-xs rounded flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear View</span>
            </button>
          </div>
        </div>

        {/* Terminal Screen (Image 1) */}
        <div className="relative bg-[#0a0e16] border border-[#1c2028] rounded-lg shadow-inner overflow-hidden flex flex-col">
          {/* Header Bar */}
          <div className="flex items-center justify-between px-3 py-2 bg-[#262a33]/60 border-b border-[#1c2028] font-mono text-xs text-[#bbcabf]">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#ffb4ab]/80 inline-block"></span>
                <span className="w-3 h-3 rounded-full bg-[#4cd7f6]/80 inline-block"></span>
                <span className="w-3 h-3 rounded-full bg-[#4edea3]/80 inline-block"></span>
              </div>
              <span className="text-[#dfe2ee] font-semibold">/proc/kmsg — dmesg -w -k -x</span>
            </div>
            <div className="flex items-center gap-4 text-[#86948a] text-[11px]">
              <span>ENCODING: UTF-8</span>
              <span>BUFFER: RING_LOCKED</span>
              <span className="text-[#4edea3] flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full bg-[#4edea3] ${!isStreamPaused ? 'animate-pulse' : ''}`}></span>
                {isStreamPaused ? 'FEED PAUSED' : 'FEED LIVE'}
              </span>
            </div>
          </div>

          {/* Terminal Body */}
          <div
            ref={terminalRef}
            className="p-3.5 overflow-y-auto max-h-[460px] min-h-[340px] space-y-1 font-mono text-xs leading-relaxed select-text terminal-scroll"
          >
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-3 hover:bg-[#1c2028]/40 px-1 py-0.5 rounded transition-colors"
              >
                <span className="text-[#86948a] font-mono text-[11px] shrink-0">
                  [ {log.timestamp.toFixed(6)} ]
                </span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] shrink-0 ${getLevelBadge(log.level)}`}>
                  KERN_{log.level}
                </span>
                <span className={`shrink-0 w-24 ${getSubsystemColor(log.subsystem)}`}>
                  {log.subsystem}:
                </span>
                <span className="text-[#dfe2ee] break-all">{log.message}</span>
              </div>
            ))}
          </div>

          {/* Status Bar */}
          <div className="px-3 py-1.5 bg-[#1c2028] border-t border-[#262a33] flex items-center justify-between text-[#86948a] font-mono text-[11px]">
            <div className="flex items-center gap-3">
              <span>
                Filter: Subsystem [{selectedSubsystem.toUpperCase()}], Level [{selectedLevel}]
              </span>
              <span className="hidden md:inline">|</span>
              <span className="hidden md:inline">
                sysfs node: /sys/module/sysmonitor/parameters/log_level = 7
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span>STREAM: klogd</span>
              <span className="w-2 h-2 rounded-full bg-[#4edea3]"></span>
            </div>
          </div>
        </div>
      </section>

      {/* Severity Distribution & Internal Data Flow (Image 1) */}
      <section className="grid grid-cols-12 gap-4 items-stretch">
        {/* Severity Distribution Bar Chart */}
        <div className="col-span-12 lg:col-span-4 bg-[#181c24] border border-[#262a33] rounded-xl p-5 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="font-mono text-xs uppercase tracking-wider text-[#86948a]">
                Severity Distribution
              </span>
              <span className="text-[#4edea3] font-mono text-xs font-semibold">
                1,248 msgs / session
              </span>
            </div>
            <p className="text-xs text-[#bbcabf] mb-4">
              printk verbosity mapping across the system uptime
            </p>

            {/* Inline SVG Chart */}
            <div className="w-full flex items-center justify-center py-2">
              <svg className="w-full h-32 overflow-visible" viewBox="0 0 300 130">
                <line className="text-[#262a33]" stroke="currentColor" strokeDasharray="3,3" x1="40" x2="290" y1="10" y2="10" />
                <line className="text-[#262a33]" stroke="currentColor" strokeDasharray="3,3" x1="40" x2="290" y1="50" y2="50" />
                <line className="text-[#262a33]" stroke="currentColor" strokeDasharray="3,3" x1="40" x2="290" y1="90" y2="90" />

                {/* CRIT */}
                <text className="text-[#86948a] font-mono text-[10px]" fill="currentColor" textAnchor="end" x="30" y="24">CRIT</text>
                <rect className="text-[#ffb4ab]" fill="currentColor" height="12" rx="2" width="2" x="40" y="14" />
                <text className="text-[#86948a] font-mono text-[10px]" fill="currentColor" x="48" y="24">0 (0%)</text>

                {/* ERR */}
                <text className="text-[#86948a] font-mono text-[10px]" fill="currentColor" textAnchor="end" x="30" y="44">ERR</text>
                <rect className="text-[#ffb4ab]" fill="currentColor" height="12" rx="2" width="14" x="40" y="34" />
                <text className="text-[#ffb4ab] font-mono text-[10px]" fill="currentColor" x="60" y="44">3 (0.2%)</text>

                {/* WARN */}
                <text className="text-[#86948a] font-mono text-[10px]" fill="currentColor" textAnchor="end" x="30" y="64">WARN</text>
                <rect className="text-[#4cd7f6]" fill="currentColor" height="12" rx="2" width="28" x="40" y="54" />
                <text className="text-[#4cd7f6] font-mono text-[10px]" fill="currentColor" x="74" y="64">14 (1.1%)</text>

                {/* INFO */}
                <text className="text-[#86948a] font-mono text-[10px]" fill="currentColor" textAnchor="end" x="30" y="84">INFO</text>
                <rect className="text-[#4edea3]" fill="currentColor" height="12" rx="2" width="185" x="40" y="74" />
                <text className="text-[#4edea3] font-mono text-[10px] font-semibold" fill="currentColor" x="232" y="84">912 (73.1%)</text>

                {/* DEBUG */}
                <text className="text-[#86948a] font-mono text-[10px]" fill="currentColor" textAnchor="end" x="30" y="104">DEBUG</text>
                <rect className="text-[#d0bcff]" fill="currentColor" height="12" rx="2" width="70" x="40" y="94" />
                <text className="text-[#d0bcff] font-mono text-[10px]" fill="currentColor" x="116" y="104">319 (25.6%)</text>
              </svg>
            </div>
          </div>

          <div className="mt-4 p-2.5 bg-[#1c2028] border border-[#262a33] rounded-lg flex items-center justify-between">
            <span className="text-xs font-mono text-[#bbcabf]">Default Console LogLevel:</span>
            <span className="text-xs font-mono text-[#4edea3] font-semibold">KERN_DEBUG (7) [VERBOSE]</span>
          </div>
        </div>

        {/* Ring Buffer Architecture & Data Flow */}
        <div className="col-span-12 lg:col-span-8 bg-[#181c24] border border-[#262a33] rounded-xl p-5 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="font-mono text-xs uppercase tracking-wider text-[#86948a]">
                Internal Data Flow: dmesg &amp; sysmonitor Driver
              </span>
              <span className="px-2 py-0.5 rounded bg-[#1c2028] border border-[#262a33] text-[#4cd7f6] font-mono text-xs">
                mmap() Zero-Copy
              </span>
            </div>
            <p className="text-xs text-[#bbcabf] mb-4">
              Execution topology linking kernel-space printk ring to the sysmonitor daemon
            </p>

            {/* 4 Pipeline Diagram Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
              <div className="bg-[#1c2028] border border-[#262a33] rounded-lg p-3 flex flex-col justify-between">
                <span className="font-mono text-[10px] text-[#86948a]">LAYER 0</span>
                <div className="my-2">
                  <span className="font-mono text-xs font-bold text-[#4edea3]">printk() Call</span>
                  <p className="text-[11px] text-[#bbcabf] mt-1 leading-normal">
                    Driver invokes <code className="text-[#dfe2ee]">pr_info()</code> or <code className="text-[#dfe2ee]">dev_warn()</code> via kernel ABI.
                  </p>
                </div>
                <span className="font-mono text-[10px] text-[#4edea3]">Non-blocking IRQ-safe</span>
              </div>

              <div className="bg-[#1c2028] border border-[#262a33] rounded-lg p-3 flex flex-col justify-between">
                <span className="font-mono text-[10px] text-[#86948a]">LAYER 1</span>
                <div className="my-2">
                  <span className="font-mono text-xs font-bold text-[#4cd7f6]">printk_ringbuffer</span>
                  <p className="text-[11px] text-[#bbcabf] mt-1 leading-normal">
                    Lockless atomic descriptors holding sequence, timestamp, text data slab.
                  </p>
                </div>
                <span className="font-mono text-[10px] text-[#4cd7f6]">prb_read_valid()</span>
              </div>

              <div className="bg-[#1c2028] border border-[#262a33] rounded-lg p-3 flex flex-col justify-between">
                <span className="font-mono text-[10px] text-[#86948a]">LAYER 2</span>
                <div className="my-2">
                  <span className="font-mono text-xs font-bold text-[#d0bcff]">sysmonitor.ko</span>
                  <p className="text-[11px] text-[#bbcabf] mt-1 leading-normal">
                    Direct kernel hook exposes memory mapped pages to <code className="text-[#dfe2ee]">/dev/sysmonitor</code>.
                  </p>
                </div>
                <span className="font-mono text-[10px] text-[#d0bcff]">IOCTL 0x80047301</span>
              </div>

              <div className="bg-[#1c2028] border border-[#262a33] rounded-lg p-3 flex flex-col justify-between">
                <span className="font-mono text-[10px] text-[#86948a]">LAYER 3</span>
                <div className="my-2">
                  <span className="font-mono text-xs font-bold text-[#dfe2ee]">C++ Daemon</span>
                  <p className="text-[11px] text-[#bbcabf] mt-1 leading-normal">
                    Consumes telemetry, parses regex filters, pipes events to dashboard UI.
                  </p>
                </div>
                <span className="font-mono text-[10px] text-[#4edea3]">PID 4892 (epoll)</span>
              </div>
            </div>
          </div>

          <div className="mt-4 p-2.5 bg-[#1c2028] border border-[#262a33] rounded-lg flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-mono text-[#bbcabf]">
              <span className="text-[#86948a]">SLAB ALLOCATION:</span>
              <span className="text-[#dfe2ee]">kmalloc-512 (64 items)</span>
              <span className="text-[#86948a]">|</span>
              <span className="text-[#86948a]">DMA COHERENT:</span>
              <span className="text-[#4edea3]">NO_BOUNCE</span>
            </div>
            <span className="text-xs font-mono text-[#4edea3] flex items-center gap-1.5 font-semibold">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>sysmonitor slab verified leak-free</span>
            </span>
          </div>
        </div>
      </section>
    </div>
  );
};
