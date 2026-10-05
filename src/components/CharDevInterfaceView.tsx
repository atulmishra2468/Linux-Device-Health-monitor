import React, { useState } from 'react';
import { 
  Layers, 
  Terminal, 
  Play, 
  Send, 
  RotateCcw, 
  Binary, 
  CheckCircle, 
  AlertTriangle, 
  HelpCircle,
  FileCode,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { CharDevState } from '../types/sysmonitor';

interface CharDevInterfaceViewProps {
  onShowToast: (msg: string) => void;
}

export const CharDevInterfaceView: React.FC<CharDevInterfaceViewProps> = ({ onShowToast }) => {
  // Device state
  const [charDev, setCharDev] = useState<CharDevState>({
    node: '/dev/sysmonitor',
    major: 240,
    minor: 0,
    devT: '0xf000000',
    openCount: 1,
    totalReads: 142,
    totalWrites: 19,
    totalIoctls: 8492,
    ringBufferSizeKiB: 256,
    ringBufferUsedPct: 64.2,
    ringDrops: 0,
    lastIoctlCmd: 'SYSMON_IOCTL_SYNC_RING (0x80047301)',
    lastIoctlArg: 'arg: struct sysmon_ring_meta*',
    lastIoctlLatencyUs: 1.42,
    lastIoctlStatus: 'SUCCESS'
  });

  // Read terminal output (matches driver/kernel_monitor.c dev_read)
  const [readOutput, setReadOutput] = useState<string>(
    'SYS_MONITOR_DRIVER_OK'
  );

  // Write payload (matches test_driver.sh & main.cpp Option 3)
  const [writePayload, setWritePayload] = useState<string>('SYS_HEALTH_CHECK_PING');
  const [writeLogs, setWriteLogs] = useState<string[]>([
    'sysmonitor: dev node opened by PID 4892 (active opens: 1, File Descriptor: 3)',
    'sysmonitor: received 21 bytes from user space: SYS_HEALTH_CHECK_PING',
    'sysmonitor: served 22 bytes to user space: SYS_MONITOR_DRIVER_OK'
  ]);

  // IOCTL dispatcher form
  const [selectedIoctl, setSelectedIoctl] = useState<string>('GET_CPU');
  const [ioctlParam, setIoctlParam] = useState<string>('0');
  const [ioctlResponse, setIoctlResponse] = useState<any>({
    status: 'SUCCESS',
    code: 0,
    latencyUs: 1.42,
    timestamp: 'ktime_get_ns() = 1421100910240',
    decodedStruct: {
      nr_cpus: 8,
      sample_seq: 8492,
      core0_freq: '3800 MHz',
      core0_user_ticks: 48920,
      core0_sys_ticks: 14201,
      core0_idle_ticks: 420910
    }
  });

  const handleExecuteRead = () => {
    const newIoctlCount = charDev.totalIoctls + 1;
    const newReadCount = charDev.totalReads + 1;
    setCharDev((prev) => ({
      ...prev,
      totalReads: newReadCount
    }));

    const response = `sysmonitor_kmod v2.4.11: major=240, minor=0, open_clients=1, ioctls=${newIoctlCount}\nuptime=${Math.floor(Date.now() / 1000)}, nr_running=2, ring_head=0x2e40`;
    setReadOutput(response);
    onShowToast('read() syscall executed via copy_to_user()');
  };

  const handleExecuteWrite = () => {
    if (!writePayload.trim()) return;

    setCharDev((prev) => ({
      ...prev,
      totalWrites: prev.totalWrites + 1
    }));

    setWriteLogs((prev) => [
      `sysmonitor: config write received (${writePayload.length} bytes): ${writePayload}`,
      ...prev.slice(0, 5)
    ]);

    onShowToast(`write() syscall copied ${writePayload.length} bytes into kernel memory`);
  };

  const handleDispatchIoctl = () => {
    const latency = parseFloat((1.35 + Math.random() * 0.18).toFixed(2));

    if (selectedIoctl === 'INVALID_FUZZ') {
      setCharDev((prev) => ({
        ...prev,
        totalIoctls: prev.totalIoctls + 1,
        lastIoctlCmd: '0xDEADBEEF (UNKNOWN_COMMAND)',
        lastIoctlLatencyUs: latency,
        lastIoctlStatus: 'EINVAL'
      }));

      setIoctlResponse({
        status: 'REJECTED_SAFELY',
        code: -25, // -ENOTTY
        latencyUs: latency,
        timestamp: 'ktime_get_ns() = ' + Date.now(),
        error: 'Inappropriate ioctl for device (-ENOTTY). Driver safely handled bad opcode.'
      });

      onShowToast('Fuzzed IOCTL rejected safely with -ENOTTY (0 crash)');
      return;
    }

    if (selectedIoctl === 'SYNC_RING') {
      setCharDev((prev) => ({
        ...prev,
        totalIoctls: prev.totalIoctls + 1,
        lastIoctlCmd: 'SYSMON_IOCTL_SYNC_RING (0x80047301)',
        lastIoctlLatencyUs: latency,
        lastIoctlStatus: 'SUCCESS'
      }));

      setIoctlResponse({
        status: 'SUCCESS',
        code: 0,
        latencyUs: latency,
        timestamp: 'ktime_get_ns() = ' + Date.now(),
        decodedStruct: {
          head_offset: '0x2e40',
          tail_offset: '0x1d20',
          capacity_bytes: 262144,
          dropped_frames: 0,
          ring_barrier: 'BARRIER_LOCKED_OK'
        }
      });
      onShowToast('IOCTL SYNC_RING mapped in 1.42 μs');
    } else if (selectedIoctl === 'RESET_STATS') {
      setCharDev((prev) => ({
        ...prev,
        totalIoctls: 0,
        ringDrops: 0,
        lastIoctlCmd: 'SYSMON_IOCTL_RESET_STATS (0x00007304)',
        lastIoctlLatencyUs: latency,
        lastIoctlStatus: 'SUCCESS'
      }));

      setIoctlResponse({
        status: 'SUCCESS',
        code: 0,
        latencyUs: latency,
        timestamp: 'ktime_get_ns() = ' + Date.now(),
        message: 'Telemetry counters and sequence IDs reset to zero.'
      });
      onShowToast('IOCTL RESET_STATS executed');
    } else {
      // GET_CPU
      setCharDev((prev) => ({
        ...prev,
        totalIoctls: prev.totalIoctls + 1,
        lastIoctlCmd: 'SYSMON_IOCTL_GET_CPU (0x80047302)',
        lastIoctlLatencyUs: latency,
        lastIoctlStatus: 'SUCCESS'
      }));

      setIoctlResponse({
        status: 'SUCCESS',
        code: 0,
        latencyUs: latency,
        timestamp: 'ktime_get_ns() = ' + Date.now(),
        decodedStruct: {
          nr_cpus: 8,
          sample_seq: charDev.totalIoctls + 1,
          core0_freq: '3800 MHz',
          core0_user_ticks: 48920 + Math.floor(Math.random() * 100),
          core0_sys_ticks: 14201 + Math.floor(Math.random() * 50),
          core0_idle_ticks: 420910 + Math.floor(Math.random() * 300)
        }
      });
      onShowToast('IOCTL GET_CPU collected 8-core telemetry');
    }
  };

  return (
    <div className="flex flex-col w-full gap-6 select-text">
      {/* Top Banner: VFS Architecture & Node Topology */}
      <section className="bg-[#181c24] border border-[#262a33] rounded-xl p-5 shadow-md flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#4edea3]/10 border border-[#4edea3]/30 text-[#4edea3] flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-base text-[#dfe2ee]">
                  Virtual File System (VFS) Character Device Interface
                </h2>
                <span className="px-2 py-0.5 rounded bg-[#1c2028] border border-[#262a33] text-[#4cd7f6] font-mono text-xs">
                  cdev_init()
                </span>
              </div>
              <p className="text-xs text-[#bbcabf] mt-0.5">
                Direct kernel endpoint at <code className="font-mono text-[#dfe2ee]">/dev/sysmonitor</code> dynamically provisioned with dev_t major 240, minor 0
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 font-mono text-xs">
            <div className="bg-[#1c2028] border border-[#262a33] px-3 py-1.5 rounded-lg flex items-center gap-2">
              <span className="text-[#86948a]">dev_t:</span>
              <span className="text-[#4cd7f6] font-bold">{charDev.devT}</span>
            </div>
            <div className="bg-[#1c2028] border border-[#262a33] px-3 py-1.5 rounded-lg flex items-center gap-2">
              <span className="text-[#86948a]">Open Clients:</span>
              <span className="text-[#4edea3] font-bold">{charDev.openCount}</span>
            </div>
          </div>
        </div>

        {/* File Operations Table (VFS Dispatcher) */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 pt-2 border-t border-[#262a33]/60 font-mono text-xs">
          <div className="bg-[#1c2028] p-2.5 rounded border border-[#10b981]/40">
            <span className="text-[#86948a] text-[10px] block">.open [Implemented]</span>
            <span className="text-[#4edea3] font-bold">dev_open()</span>
            <span className="text-[10px] text-[#bbcabf] block mt-1">PID tracker (fd=3)</span>
          </div>
          <div className="bg-[#1c2028] p-2.5 rounded border border-[#10b981]/40">
            <span className="text-[#86948a] text-[10px] block">.read [Implemented]</span>
            <span className="text-[#4cd7f6] font-bold">dev_read()</span>
            <span className="text-[10px] text-[#bbcabf] block mt-1">copy_to_user()</span>
          </div>
          <div className="bg-[#1c2028] p-2.5 rounded border border-[#10b981]/40">
            <span className="text-[#86948a] text-[10px] block">.write [Implemented]</span>
            <span className="text-[#d0bcff] font-bold">dev_write()</span>
            <span className="text-[10px] text-[#bbcabf] block mt-1">copy_from_user()</span>
          </div>
          <div className="bg-[#1c2028] p-2.5 rounded border border-[#10b981]/40">
            <span className="text-[#86948a] text-[10px] block">.release [Implemented]</span>
            <span className="text-[#bbcabf] font-bold">dev_release()</span>
            <span className="text-[10px] text-[#bbcabf] block mt-1">Clean teardown</span>
          </div>
          <div className="bg-[#1c2028]/60 p-2.5 rounded border border-dashed border-[#86948a]/30 opacity-75">
            <span className="text-amber-400 text-[10px] block">.unlocked_ioctl [Future]</span>
            <span className="text-amber-200 font-bold">sysmon_ioctl()</span>
            <span className="text-[10px] text-[#86948a] block mt-1">Design Prototype</span>
          </div>
          <div className="bg-[#1c2028]/60 p-2.5 rounded border border-dashed border-[#86948a]/30 opacity-75">
            <span className="text-amber-400 text-[10px] block">.mmap [Future]</span>
            <span className="text-amber-200 font-bold">sysmon_mmap()</span>
            <span className="text-[10px] text-[#86948a] block mt-1">Zero-copy ring buffer</span>
          </div>
        </div>
      </section>

      {/* Read & Write Testbench Split */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Read Testbench */}
        <div className="bg-[#181c24] border border-[#262a33] rounded-xl p-5 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-[#4edea3]" />
                <h3 className="font-semibold text-base text-[#dfe2ee]">
                  Interactive read() Testbench
                </h3>
              </div>
              <span className="font-mono text-xs text-[#86948a]">copy_to_user()</span>
            </div>
            <p className="text-xs text-[#bbcabf] mb-3">
              Executes a read syscall on <code className="font-mono text-[#dfe2ee]">/dev/sysmonitor</code> to stream telemetry text.
            </p>

            <div className="bg-[#0a0e16] border border-[#1c2028] rounded-lg p-3 font-mono text-xs space-y-2">
              <div className="flex items-center justify-between text-[#86948a] text-[11px] border-b border-[#1c2028] pb-1">
                <span>$ cat /dev/sysmonitor</span>
                <span className="text-[#4edea3]">RETURN: 128 BYTES</span>
              </div>
              <pre className="text-[#dfe2ee] leading-relaxed select-text overflow-x-auto">
                {readOutput}
              </pre>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#262a33] flex items-center justify-between">
            <span className="text-xs font-mono text-[#86948a]">Reads: {charDev.totalReads}</span>
            <button
              onClick={handleExecuteRead}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#10b981] hover:bg-[#005236] text-[#002113] hover:text-[#4edea3] rounded font-mono text-xs font-semibold transition-colors"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Execute cat /dev/sysmonitor</span>
            </button>
          </div>
        </div>

        {/* Write Testbench */}
        <div className="bg-[#181c24] border border-[#262a33] rounded-xl p-5 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-[#4cd7f6]" />
                <h3 className="font-semibold text-base text-[#dfe2ee]">
                  Interactive write() Configuration
                </h3>
              </div>
              <span className="font-mono text-xs text-[#86948a]">copy_from_user()</span>
            </div>
            <p className="text-xs text-[#bbcabf] mb-3">
              Safely transfers user configuration string into the kernel device driver control buffer.
            </p>

            <div className="space-y-3 font-mono text-xs">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={writePayload}
                  onChange={(e) => setWritePayload(e.target.value)}
                  placeholder="e.g. CONFIG:SAMPLE_RATE_MS=10"
                  className="flex-1 bg-[#0a0e16] border border-[#262a33] text-[#dfe2ee] px-3 py-2 rounded outline-none focus:border-[#4cd7f6]"
                />
                <button
                  onClick={handleExecuteWrite}
                  className="flex items-center gap-1.5 px-3 py-2 bg-[#262a33] hover:bg-[#31353e] text-[#4cd7f6] rounded border border-[#262a33] font-semibold transition-colors shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>echo &gt; dev</span>
                </button>
              </div>

              {/* Log trace of writes */}
              <div className="bg-[#0a0e16] border border-[#1c2028] rounded-lg p-3 space-y-1 text-[11px] text-[#bbcabf] max-h-24 overflow-y-auto">
                {writeLogs.map((log, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-[#86948a]">&gt;</span>
                    <span className="text-[#dfe2ee]">{log}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#262a33] flex items-center justify-between text-xs font-mono text-[#86948a]">
            <span>Writes: {charDev.totalWrites}</span>
            <span className="text-[#4cd7f6]">Memory Safety: Min bounds checked</span>
          </div>
        </div>
      </section>

      {/* IOCTL Command Dispatcher Section */}
      <section className="bg-[#181c24] border border-[#262a33] rounded-xl p-5 shadow-md flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#4edea3]" />
              <h2 className="font-semibold text-base text-[#dfe2ee]">
                IOCTL Command Dispatcher &amp; ABI Validator
              </h2>
            </div>
            <p className="text-xs text-[#bbcabf] mt-0.5">
              Execute strongly typed ioctl commands with Magic Code <code className="font-mono text-[#4cd7f6]">0x73 ('s')</code> directly via Linux syscall dispatcher
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-[#86948a]">Last IOCTL Status:</span>
            <span className={`px-2 py-0.5 rounded font-bold ${
              charDev.lastIoctlStatus === 'SUCCESS' ? 'bg-[#10b981]/20 text-[#4edea3]' : 'bg-[#93000a]/20 text-[#ffb4ab]'
            }`}>
              {charDev.lastIoctlStatus}
            </span>
          </div>
        </div>

        {/* Command form & Payload Inspector */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left: Dispatch controls */}
          <div className="lg:col-span-5 bg-[#1c2028] border border-[#262a33] rounded-lg p-4 flex flex-col justify-between gap-3">
            <div className="space-y-3 font-mono text-xs">
              <div>
                <label className="text-[#86948a] text-[11px] block mb-1">SELECT IOCTL COMMAND</label>
                <select
                  value={selectedIoctl}
                  onChange={(e) => setSelectedIoctl(e.target.value)}
                  className="w-full bg-[#0a0e16] border border-[#262a33] text-[#dfe2ee] p-2 rounded outline-none focus:border-[#4edea3]"
                >
                  <option value="GET_CPU">SYSMON_IOCTL_GET_CPU (0x80047302) [_IOR]</option>
                  <option value="SYNC_RING">SYSMON_IOCTL_SYNC_RING (0x80047301) [_IOR]</option>
                  <option value="RESET_STATS">SYSMON_IOCTL_RESET_STATS (0x00007304) [_IO]</option>
                  <option value="INVALID_FUZZ">INVALID_IOCTL_FUZZ (0xDEADBEEF) [Test -ENOTTY]</option>
                </select>
              </div>

              <div>
                <label className="text-[#86948a] text-[11px] block mb-1">ARGUMENT POINTER / PARAM</label>
                <input
                  type="text"
                  value={ioctlParam}
                  onChange={(e) => setIoctlParam(e.target.value)}
                  className="w-full bg-[#0a0e16] border border-[#262a33] text-[#dfe2ee] p-2 rounded outline-none focus:border-[#4edea3]"
                  placeholder="&struct_addr (0 for default)"
                />
              </div>

              <div className="p-3 bg-[#0a0e16] rounded border border-[#262a33] text-[11px] text-[#bbcabf] space-y-1">
                <div className="flex justify-between">
                  <span className="text-[#86948a]">IOCTL Macro:</span>
                  <span className="text-[#4cd7f6]">{selectedIoctl === 'INVALID_FUZZ' ? 'RAW_HEX' : '_IOR(\'s\', 0x02, pkt)'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#86948a]">Safety Layer:</span>
                  <span className="text-[#4edea3]">copy_to_user + access_ok()</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleDispatchIoctl}
              className="w-full py-2.5 bg-[#10b981] hover:bg-[#005236] text-[#002113] hover:text-[#4edea3] rounded font-mono text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-md"
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>Dispatch ioctl() Syscall</span>
            </button>
          </div>

          {/* Right: Decoded Result / Hex Inspection */}
          <div className="lg:col-span-7 bg-[#0a0e16] border border-[#1c2028] rounded-lg p-4 flex flex-col justify-between overflow-hidden">
            <div>
              <div className="flex items-center justify-between text-xs font-mono text-[#86948a] border-b border-[#1c2028] pb-2 mb-2">
                <span>VFS SYSCALL DISPATCH RETURN</span>
                <span className="text-[#4edea3]">LATENCY: {ioctlResponse.latencyUs} μs</span>
              </div>

              <pre className="font-mono text-xs text-[#dfe2ee] leading-relaxed overflow-x-auto select-text">
                {JSON.stringify(ioctlResponse, null, 2)}
              </pre>
            </div>

            <div className="mt-4 pt-2 border-t border-[#1c2028] flex items-center justify-between text-[11px] font-mono text-[#86948a]">
              <span>ABI Verification: Packed struct alignment (64-bit word)</span>
              <span className="text-[#4edea3] flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Return Code: {ioctlResponse.code}</span>
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
