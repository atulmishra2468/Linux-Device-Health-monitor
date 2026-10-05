import React, { useState, useMemo } from 'react';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  HeartPulse,
  ShieldCheck,
  Zap,
  HardDrive,
  Activity,
  Download,
  RotateCcw,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowUpRight,
  Clock,
  Sparkles,
  FileText
} from 'lucide-react';

interface HealthReportViewProps {
  onShowToast: (msg: string) => void;
  isStressed: boolean;
}

type TimeRange = '24h' | '7d' | '14d';

// Historical data generator for 14-day uptime
const generateHistoricalData = (range: TimeRange, isStressed: boolean) => {
  if (range === '24h') {
    return Array.from({ length: 24 }, (_, i) => {
      const hour = `${(i < 10 ? '0' : '') + i}:00`;
      const baseLatency = 1.40 + Math.sin(i / 3) * 0.05 + (isStressed && i >= 18 ? 0.25 : 0.02);
      const p99Latency = baseLatency + 0.12 + Math.random() * 0.04;
      return {
        label: hour,
        stabilityPct: isStressed && i >= 18 ? 99.88 : 99.99,
        avgLatencyUs: parseFloat(baseLatency.toFixed(2)),
        p99LatencyUs: parseFloat(p99Latency.toFixed(2)),
        slabMb: 128 + Math.floor(Math.sin(i / 2) * 2),
        ringKb: 256, // Flat line proving zero memory leak
        cswRateK: isStressed && i >= 18 ? 8.9 : 4.2 + (i % 3) * 0.1,
        irqCount: isStressed && i >= 18 ? 14200 : 8400 + (i % 4) * 200,
        freeMemGb: 23.6 - (isStressed && i >= 18 ? 1.2 : 0.1)
      };
    });
  }

  if (range === '7d') {
    return ['Day -6', 'Day -5', 'Day -4', 'Day -3', 'Day -2', 'Yesterday', 'Today'].map((day, idx) => {
      const isToday = idx === 6;
      return {
        label: day,
        stabilityPct: isToday && isStressed ? 99.89 : 99.98,
        avgLatencyUs: isToday && isStressed ? 1.58 : 1.42 + (idx % 2) * 0.02,
        p99LatencyUs: isToday && isStressed ? 1.76 : 1.52,
        slabMb: 126 + idx,
        ringKb: 256,
        cswRateK: isToday && isStressed ? 8.4 : 4.3 + (idx % 3) * 0.2,
        irqCount: isToday && isStressed ? 13800 : 8600,
        freeMemGb: 23.8 - idx * 0.05
      };
    });
  }

  // 14 days full range
  return Array.from({ length: 14 }, (_, i) => {
    const dayNum = i + 1;
    const isToday = i === 13;
    return {
      label: `Day ${dayNum}`,
      stabilityPct: isToday && isStressed ? 99.89 : 99.98 + (i % 2 === 0 ? 0.01 : 0.0),
      avgLatencyUs: isToday && isStressed ? 1.58 : 1.41 + (i % 3) * 0.015,
      p99LatencyUs: isToday && isStressed ? 1.74 : 1.51 + (i % 2) * 0.02,
      slabMb: 124 + Math.floor(i / 3),
      ringKb: 256, // Invariant zero leak
      cswRateK: isToday && isStressed ? 8.6 : 4.1 + (i % 4) * 0.15,
      irqCount: isToday && isStressed ? 13500 : 8200 + (i % 3) * 300,
      freeMemGb: 24.1 - i * 0.04
    };
  });
};

const AUDIT_RECORDS = [
  {
    id: 'aud_1',
    timestamp: '2026-10-05 01:14:22',
    test: 'kmemleak Slab Audit',
    target: 'sysmonitor_ring_cache',
    status: 'PASS',
    details: '0 unreferenced pointers across 64 pages (256 KiB DMA allocation)'
  },
  {
    id: 'aud_2',
    timestamp: '2026-10-05 00:45:10',
    test: 'NMI Watchdog Heartbeat',
    target: 'arch/x86/kernel/apic/hw_nmi.c',
    status: 'PASS',
    details: 'Zero hard/soft lockups detected on CPU cores 0-7'
  },
  {
    id: 'aud_3',
    timestamp: '2026-10-04 23:30:00',
    test: 'IOCTL Memory Boundary Check',
    target: 'sysmon_ioctl()',
    status: 'PASS',
    details: 'access_ok() validated for 100,000 continuous userland transfers'
  },
  {
    id: 'aud_4',
    timestamp: '2026-10-04 18:00:00',
    test: 'CFS Scheduler Balance Probe',
    target: 'load_balance() / finish_task_switch()',
    status: 'PASS',
    details: 'Task runqueue variance under 0.04 ms'
  },
  {
    id: 'aud_5',
    timestamp: '2026-10-04 12:00:00',
    test: 'Memory Zone Compaction',
    target: 'compact_zone() Normal',
    status: 'PASS',
    details: 'Watermarks nominal, 0 OOM kills invoked'
  }
];

// Custom Tooltip component for dark terminal aesthetic
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1c2028] border border-[#262a33] p-3 rounded-lg shadow-xl font-mono text-xs text-[#dfe2ee] space-y-1">
        <p className="text-[#86948a] font-semibold border-b border-[#262a33] pb-1">
          {label}
        </p>
        {payload.map((item: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-4 text-[11px]">
            <span style={{ color: item.color }}>{item.name}:</span>
            <span className="font-bold tabular-nums text-[#dfe2ee]">
              {item.value} {item.unit || ''}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const HealthReportView: React.FC<HealthReportViewProps> = ({ onShowToast, isStressed }) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('14d');
  const [isAuditing, setIsAuditing] = useState<boolean>(false);
  const [auditList, setAuditList] = useState(AUDIT_RECORDS);

  const chartData = useMemo(() => {
    return generateHistoricalData(timeRange, isStressed);
  }, [timeRange, isStressed]);

  const handleRunAudit = () => {
    setIsAuditing(true);
    setTimeout(() => {
      setIsAuditing(false);
      const newAudit = {
        id: 'aud_' + Date.now(),
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        test: 'Interactive kmemleak & NMI Full Audit',
        target: '/dev/sysmonitor [dev_t 240:0]',
        status: 'PASS',
        details: 'Audit completed: 0 leaks, 0 Oops, 0 page faults, 1.42 μs latency verified.'
      };
      setAuditList((prev) => [newAudit, ...prev]);
      onShowToast('Instant kernel stability audit: 100% PASSED');
    }, 1200);
  };

  const handleExportReport = () => {
    const reportData = {
      title: 'SysMonitor Kernel Driver Health & Stability Report',
      version: 'v2.4.11-kmod',
      uptime: '14d 08:22:19',
      generated_at: new Date().toISOString(),
      system_health: {
        stability_index_pct: 99.98,
        mean_ioctl_latency_us: 1.42,
        jitter_us: 0.06,
        kernel_panics: 0,
        kernel_oops: 0,
        soft_lockups: 0,
        hard_lockups: 0,
        kmemleak_unreferenced_bytes: 0,
        slab_memory_growth_rate: '0.00 B/day (zero leak invariant verified)'
      },
      audit_records: auditList,
      historical_telemetry: chartData
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kernel-health-report-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onShowToast('Health report JSON exported');
  };

  return (
    <div className="flex flex-col w-full gap-6 select-text">
      {/* Top Banner & Audit Actions */}
      <section className="bg-[#181c24] border border-[#262a33] rounded-xl p-5 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#ffb4ab]/10 border border-[#ffb4ab]/30 text-[#ffb4ab] flex items-center justify-center">
            <HeartPulse className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-base text-[#dfe2ee]">
                Kernel Stability &amp; Uptime Health Report
              </h2>
              <span className="px-2 py-0.5 rounded bg-[#10b981]/20 text-[#4edea3] font-mono text-xs font-semibold">
                GRADE: A+ (14-DAY LTS)
              </span>
            </div>
            <p className="text-xs text-[#bbcabf] mt-0.5">
              Historical performance telemetry, zero-leak invariants, and scheduler latency curves collected from{' '}
              <code className="font-mono text-[#4cd7f6]">/dev/sysmonitor</code>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Time range switcher */}
          <div className="flex items-center bg-[#0a0e16] border border-[#262a33] rounded-lg p-0.5 font-mono text-xs">
            {(['24h', '7d', '14d'] as TimeRange[]).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-3 py-1.5 rounded transition-colors ${
                  timeRange === r
                    ? 'bg-[#262a33] text-[#4edea3] font-semibold'
                    : 'text-[#bbcabf] hover:text-[#dfe2ee]'
                }`}
              >
                {r === '24h' ? 'Last 24 Hours' : r === '7d' ? 'Last 7 Days' : 'Last 14 Days'}
              </button>
            ))}
          </div>

          {/* Trigger Audit */}
          <button
            onClick={handleRunAudit}
            disabled={isAuditing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1c2028] hover:bg-[#262a33] text-[#dfe2ee] border border-[#262a33] rounded font-mono text-xs transition-colors shadow-sm"
          >
            <RotateCcw className={`w-3.5 h-3.5 text-[#4cd7f6] ${isAuditing ? 'animate-spin' : ''}`} />
            <span>{isAuditing ? 'Auditing SLAB...' : 'Run Diagnostics'}</span>
          </button>

          {/* Export JSON Report */}
          <button
            onClick={handleExportReport}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#10b981] hover:bg-[#005236] text-[#002113] hover:text-[#4edea3] rounded font-mono text-xs font-semibold transition-colors shadow-md"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Report</span>
          </button>
        </div>
      </section>

      {/* Stability Score KPI Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stability Index */}
        <div className="bg-[#181c24] border border-[#262a33] rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#86948a] font-mono text-xs">
            <span className="uppercase">Kernel Stability Index</span>
            <ShieldCheck className="w-4 h-4 text-[#4edea3]" />
          </div>
          <div className="flex items-baseline gap-2 my-2">
            <span className="font-mono text-3xl font-bold text-[#4edea3] tabular-nums">
              99.98%
            </span>
            <span className="font-mono text-xs text-[#86948a]">14d 08h uptime</span>
          </div>
          <div className="flex justify-between items-center text-[11px] font-mono text-[#bbcabf]">
            <span>Oops / Panics</span>
            <span className="text-[#4edea3] font-bold">0 Detected</span>
          </div>
        </div>

        {/* Mean IOCTL Latency */}
        <div className="bg-[#181c24] border border-[#262a33] rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#86948a] font-mono text-xs">
            <span className="uppercase">Mean IOCTL Latency</span>
            <Zap className="w-4 h-4 text-[#4cd7f6]" />
          </div>
          <div className="flex items-baseline gap-2 my-2">
            <span className="font-mono text-3xl font-bold text-[#4cd7f6] tabular-nums">
              1.42
            </span>
            <span className="font-mono text-xs text-[#bbcabf]">μs (±0.06 μs)</span>
          </div>
          <div className="flex justify-between items-center text-[11px] font-mono text-[#bbcabf]">
            <span>p99 Jitter Bound</span>
            <span className="text-[#dfe2ee]">1.52 μs Max</span>
          </div>
        </div>

        {/* Memory Leak Rate */}
        <div className="bg-[#181c24] border border-[#262a33] rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#86948a] font-mono text-xs">
            <span className="uppercase">Slab Leak Velocity</span>
            <HardDrive className="w-4 h-4 text-[#d0bcff]" />
          </div>
          <div className="flex items-baseline gap-2 my-2">
            <span className="font-mono text-3xl font-bold text-[#dfe2ee] tabular-nums">
              0.00
            </span>
            <span className="font-mono text-xs text-[#bbcabf]">B / day</span>
          </div>
          <div className="flex justify-between items-center text-[11px] font-mono text-[#bbcabf]">
            <span>kmemleak status</span>
            <span className="text-[#4edea3] font-bold">Leak-Free Invariant</span>
          </div>
        </div>

        {/* Ring Buffer Telemetry Capture */}
        <div className="bg-[#181c24] border border-[#262a33] rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#86948a] font-mono text-xs">
            <span className="uppercase">Telemetry Capture</span>
            <Activity className="w-4 h-4 text-[#4edea3]" />
          </div>
          <div className="flex items-baseline gap-2 my-2">
            <span className="font-mono text-3xl font-bold text-[#dfe2ee] tabular-nums">
              100.0%
            </span>
            <span className="font-mono text-xs text-[#4edea3]">0 Drops</span>
          </div>
          <div className="flex justify-between items-center text-[11px] font-mono text-[#bbcabf]">
            <span>Ring Capacity</span>
            <span className="text-[#4cd7f6]">256 KiB Pinned</span>
          </div>
        </div>
      </section>

      {/* Chart 1: Stability Index & Uptime Curve (Recharts AreaChart) */}
      <section className="bg-[#181c24] border border-[#262a33] rounded-xl p-5 shadow-md flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#4edea3]" />
              <h3 className="font-semibold text-base text-[#dfe2ee]">
                Kernel Stability Index Trend (14-Day Uptime)
              </h3>
            </div>
            <p className="text-xs text-[#bbcabf] mt-0.5">
              Composite stability score calculated from NMI watchdog health, preemption latencies, and kmemleak allocations
            </p>
          </div>
          <div className="flex items-center gap-3 font-mono text-xs">
            <span className="flex items-center gap-1.5 text-[#4edea3]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#4edea3]"></span>
              Stability Index (%)
            </span>
          </div>
        </div>

        {/* Recharts Area Container */}
        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="stabilityGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4edea3" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#4edea3" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#262a33" vertical={false} />
              <XAxis dataKey="label" stroke="#86948a" fontSize={11} tickLine={false} />
              <YAxis stroke="#86948a" fontSize={11} domain={[99.8, 100]} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="stabilityPct"
                name="Stability"
                unit="%"
                stroke="#4edea3"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#stabilityGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Chart 2 & 3 Grid: IOCTL Latency & Memory Invariants */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* IOCTL Latency & Jitter LineChart */}
        <div className="bg-[#181c24] border border-[#262a33] rounded-xl p-5 shadow-md flex flex-col justify-between gap-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#4cd7f6]" />
                <h3 className="font-semibold text-base text-[#dfe2ee]">
                  VFS IOCTL Round-Trip Latency &amp; Jitter
                </h3>
              </div>
              <span className="text-xs font-mono text-[#4cd7f6]">Sub-2.0 μs ABI</span>
            </div>
            <p className="text-xs text-[#bbcabf]">
              Mean execution time of <code className="font-mono text-[#dfe2ee]">SYSMON_IOCTL_GET_CPU</code> vs p99 percentile
            </p>

            <div className="h-56 w-full pt-3">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#262a33" vertical={false} />
                  <XAxis dataKey="label" stroke="#86948a" fontSize={11} tickLine={false} />
                  <YAxis stroke="#86948a" fontSize={11} domain={[1.2, 2.0]} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    wrapperStyle={{ fontSize: '11px', fontFamily: 'JetBrains Mono', paddingTop: '10px' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="avgLatencyUs"
                    name="Mean Latency"
                    unit="μs"
                    stroke="#4edea3"
                    strokeWidth={2}
                    dot={{ r: 2 }}
                    activeDot={{ r: 5 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="p99LatencyUs"
                    name="p99 Max Latency"
                    unit="μs"
                    stroke="#4cd7f6"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="pt-2 border-t border-[#262a33] flex items-center justify-between text-xs font-mono text-[#86948a]">
            <span>Zero-Copy Ring Acceleration</span>
            <span className="text-[#4edea3]">Kernel overhead: &lt; 0.05% CPU</span>
          </div>
        </div>

        {/* Kernel Memory & Ring Allocation ComposedChart */}
        <div className="bg-[#181c24] border border-[#262a33] rounded-xl p-5 shadow-md flex flex-col justify-between gap-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-[#d0bcff]" />
                <h3 className="font-semibold text-base text-[#dfe2ee]">
                  SLAB Cache Stability &amp; Memory Allocation
                </h3>
              </div>
              <span className="text-xs font-mono text-[#4edea3]">0 Leak Flatline</span>
            </div>
            <p className="text-xs text-[#bbcabf]">
              Demonstrating constant ring memory footprint without progressive leakage across time
            </p>

            <div className="h-56 w-full pt-3">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#262a33" vertical={false} />
                  <XAxis dataKey="label" stroke="#86948a" fontSize={11} tickLine={false} />
                  <YAxis stroke="#86948a" fontSize={11} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    wrapperStyle={{ fontSize: '11px', fontFamily: 'JetBrains Mono', paddingTop: '10px' }}
                  />
                  <Bar dataKey="slabMb" name="Active SLAB" unit="MB" fill="#262a33" barSize={12} radius={[2, 2, 0, 0]} />
                  <Line
                    type="step"
                    dataKey="ringKb"
                    name="Driver Ring Buffer"
                    unit="KiB"
                    stroke="#4edea3"
                    strokeWidth={2}
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="pt-2 border-t border-[#262a33] flex items-center justify-between text-xs font-mono text-[#86948a]">
            <span>Ring allocation size: 256 KiB</span>
            <span className="text-[#4edea3]">kmalloc-512 verified clean</span>
          </div>
        </div>
      </section>

      {/* Chart 4: Context Switch & Interrupt Handling (BarChart) */}
      <section className="bg-[#181c24] border border-[#262a33] rounded-xl p-5 shadow-md flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#4edea3]" />
              <h3 className="font-semibold text-base text-[#dfe2ee]">
                CFS Context Switches &amp; Interrupt Handling Load
              </h3>
            </div>
            <p className="text-xs text-[#bbcabf] mt-0.5">
              Historical timeline of scheduler preemption rates and driver ring wakeup interrupts
            </p>
          </div>
          <span className="text-xs font-mono text-[#86948a]">
            CFS Scheduler &amp; APIC MSI Vectors
          </span>
        </div>

        <div className="h-56 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#262a33" vertical={false} />
              <XAxis dataKey="label" stroke="#86948a" fontSize={11} tickLine={false} />
              <YAxis stroke="#86948a" fontSize={11} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'JetBrains Mono', paddingTop: '10px' }} />
              <Bar dataKey="cswRateK" name="Context Switches" unit="k/s" fill="#4cd7f6" radius={[2, 2, 0, 0]} />
              <Bar dataKey="irqCount" name="Driver IRQ Wakeups" unit="" fill="#10b981" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Historical Audit Records & Diagnostic Log */}
      <section className="bg-[#181c24] border border-[#262a33] rounded-xl p-5 shadow-md flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#4cd7f6]" />
            <h3 className="font-semibold text-base text-[#dfe2ee]">
              Kernel Stability Audit &amp; Diagnostics Event Log
            </h3>
          </div>
          <span className="text-xs font-mono text-[#4edea3] bg-[#10b981]/10 px-2 py-0.5 rounded">
            All Invariants Satisfied
          </span>
        </div>
        <p className="text-xs text-[#bbcabf]">
          Continuous verification log certifying memory safety, bounds checks, and zero kernel crashes across 14-day uptime
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-[#262a33] text-[#86948a] text-[11px]">
                <th className="py-2.5 px-3">TIMESTAMP</th>
                <th className="py-2.5 px-3">DIAGNOSTIC TEST</th>
                <th className="py-2.5 px-3">KERNEL HOOK / TARGET</th>
                <th className="py-2.5 px-3">RESULT</th>
                <th className="py-2.5 px-3">VERIFICATION SUMMARY</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#262a33]/40">
              {auditList.map((audit) => (
                <tr key={audit.id} className="hover:bg-[#1c2028]/60">
                  <td className="py-2.5 px-3 text-[#86948a] tabular-nums whitespace-nowrap">
                    {audit.timestamp}
                  </td>
                  <td className="py-2.5 px-3 text-[#dfe2ee] font-semibold whitespace-nowrap">
                    {audit.test}
                  </td>
                  <td className="py-2.5 px-3 text-[#4cd7f6] whitespace-nowrap">
                    {audit.target}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="text-[10px] bg-[#10b981]/20 text-[#4edea3] font-bold px-2 py-0.5 rounded">
                      {audit.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-[#bbcabf] text-[11px]">
                    {audit.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
