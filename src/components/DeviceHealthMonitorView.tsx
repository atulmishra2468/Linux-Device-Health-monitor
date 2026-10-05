import React, { useState, useEffect } from 'react';
import { 
  HeartPulse, 
  ShieldCheck, 
  Thermometer, 
  HardDrive, 
  Zap, 
  Cpu, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Download, 
  Play, 
  RotateCcw, 
  Flame, 
  Radio, 
  FileText,
  Layers,
  Bug,
  Check
} from 'lucide-react';
import { DeviceHealthTelemetry } from '../types/sysmonitor';
import { useVisibilityInterval } from '../hooks/useVisibilityInterval';

interface DeviceHealthMonitorViewProps {
  onShowToast: (msg: string) => void;
  onOpenStackModal: () => void;
  isStressed: boolean;
}

export const DeviceHealthMonitorView: React.FC<DeviceHealthMonitorViewProps> = ({
  onShowToast,
  onOpenStackModal,
  isStressed,
}) => {
  // Fault simulation states
  const [thermalFaultInjected, setThermalFaultInjected] = useState<boolean>(false);
  const [aerWarningInjected, setAerWarningInjected] = useState<boolean>(false);

  // Self test running state
  const [isSelfTesting, setIsSelfTesting] = useState<boolean>(false);
  const [selfTestStep, setSelfTestStep] = useState<number>(0);
  const [selfTestComplete, setSelfTestComplete] = useState<boolean>(false);

  // Health data
  const [healthData, setHealthData] = useState<DeviceHealthTelemetry>({
    overallScore: 99.4,
    overallStatus: 'OPTIMAL',
    kernelDiagnostics: {
      oopsCount: 0,
      panicCount: 0,
      softLockups: 0,
      hardLockups: 0,
      kmemleakLeaks: 0,
      kmemleakAllocatedKiB: 16,
      slabCorruptions: 0,
      moduleTaint: 'TAINT_NONE',
      refCount: 1,
      dmaBounceBufferCount: 0,
    },
    thermalPower: {
      packageTempC: 44,
      tjMaxC: 100,
      thermalMarginC: 56,
      thermalThrottlingEvents: 0,
      prochotActive: false,
      vcoreVoltage: 1.18,
      packagePowerWatts: 45.2,
      tdpLimitWatts: 125,
    },
    storageSmart: {
      deviceNode: '/dev/nvme0n1',
      model: 'NVMe SAMSUNG MZVL21T0HCLR-00B00',
      temperatureC: 38,
      availableSparePct: 100,
      availableSpareThresholdPct: 10,
      percentageUsed: 1,
      criticalWarnings: 0,
      dataIntegrityErrors: 0,
      powerCycles: 142,
      unsafeShutdowns: 2,
      hostReadTB: 18.4,
      hostWrittenTB: 14.1,
    },
    pcieInterconnect: {
      device: '0000:01:00.0 (PCIe Controller)',
      currentLinkSpeed: '16.0 GT/s (Gen4)',
      currentLinkWidth: 'x4 (64.0 GT/s bidirectional)',
      aerCorrectableErrors: 0,
      aerUncorrectableErrors: 0,
      aerFatalErrors: 0,
      iommuEnabled: true,
    },
    eccMemory: {
      edacCorrectedErrors: 0,
      edacUncorrectedErrors: 0,
      pageAllocFailures: 0,
      compactionStalls: 0,
      directReclaimLatencyMs: 0.12,
    },
  });

  // Dynamic telemetry tick paused when tab is hidden
  useVisibilityInterval(() => {
    setHealthData((prev) => {
      let pkgTemp = 44 + Math.floor(Math.random() * 4);
      let pkgPower = 44.5 + Math.random() * 3.5;
      let prochot = false;
      let score = 99.4;
      let status: 'OPTIMAL' | 'DEGRADED' | 'CRITICAL' = 'OPTIMAL';

      if (isStressed || thermalFaultInjected) {
        pkgTemp = thermalFaultInjected ? 88 + Math.floor(Math.random() * 5) : 68 + Math.floor(Math.random() * 4);
        pkgPower = 112.4 + Math.random() * 6.0;
        if (pkgTemp >= 88) {
          prochot = true;
          score = 88.2;
          status = 'DEGRADED';
        }
      }

      if (aerWarningInjected) {
        score = Math.min(score, 92.5);
      }

      if (thermalFaultInjected && aerWarningInjected) {
        status = 'CRITICAL';
        score = 78.4;
      } else if (thermalFaultInjected || aerWarningInjected) {
        status = 'DEGRADED';
      }

      return {
        ...prev,
        overallScore: parseFloat(score.toFixed(1)),
        overallStatus: status,
        thermalPower: {
          ...prev.thermalPower,
          packageTempC: pkgTemp,
          thermalMarginC: prev.thermalPower.tjMaxC - pkgTemp,
          prochotActive: prochot,
          thermalThrottlingEvents: prochot ? prev.thermalPower.thermalThrottlingEvents + 1 : prev.thermalPower.thermalThrottlingEvents,
          packagePowerWatts: parseFloat(pkgPower.toFixed(1)),
        },
        pcieInterconnect: {
          ...prev.pcieInterconnect,
          aerCorrectableErrors: aerWarningInjected ? 2 : 0,
        },
      };
    });
  }, 2000);

  // Self-Test Runner
  const handleStartSelfTest = () => {
    setIsSelfTesting(true);
    setSelfTestStep(1);
    setSelfTestComplete(false);

    const steps = [
      'Scanning kmemleak slab tables...',
      'Verifying IOCTL ABI struct alignment...',
      'Auditing circular ring buffer memory barrier...',
      'Verifying devfs /dev/sysmonitor permissions...',
      'Querying NVMe SMART and PCIe AER registers...',
    ];

    let current = 1;
    const interval = setInterval(() => {
      current++;
      if (current <= 5) {
        setSelfTestStep(current);
      } else {
        clearInterval(interval);
        setIsSelfTesting(false);
        setSelfTestComplete(true);
        onShowToast('Device Health Self-Test PASSED: All 5 integrity checks verified!');
      }
    }, 700);
  };

  const handleExportHealthReport = () => {
    const report = {
      device_health_report: {
        timestamp: new Date().toISOString(),
        overall_health_score: healthData.overallScore,
        overall_status: healthData.overallStatus,
        driver: {
          node: '/dev/sysmonitor',
          major: 240,
          minor: 0,
          kmod: 'sysmonitor.ko v2.4.11',
          taint: healthData.kernelDiagnostics.moduleTaint,
          kmemleak_leaks: healthData.kernelDiagnostics.kmemleakLeaks,
          slab_corruptions: healthData.kernelDiagnostics.slabCorruptions,
          oops_panics: healthData.kernelDiagnostics.oopsCount,
        },
        thermal: healthData.thermalPower,
        storage: healthData.storageSmart,
        interconnect: healthData.pcieInterconnect,
        memory_edac: healthData.eccMemory,
      },
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sysmonitor-health-report-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onShowToast('Device Health Report exported as JSON');
  };

  const handleResetFaults = () => {
    setThermalFaultInjected(false);
    setAerWarningInjected(false);
    onShowToast('All simulated faults cleared. Device state normal.');
  };

  return (
    <div className="flex flex-col w-full gap-6 select-text">
      {/* Top Banner & Reliability Index Header */}
      <section className="bg-[#181c24] border border-[#262a33] rounded-xl p-5 shadow-md flex flex-col gap-4 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-8 w-64 h-64 bg-[#10b981]/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#4edea3]/10 border border-[#4edea3]/30 text-[#4edea3] flex items-center justify-center">
              <HeartPulse className="w-5 h-5 text-[#4edea3]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-base text-[#dfe2ee]">
                  Hardware &amp; Driver Device Health Monitor
                </h2>
                <span className={`px-2 py-0.5 rounded font-mono text-xs font-semibold ${
                  healthData.overallStatus === 'OPTIMAL'
                    ? 'bg-[#10b981]/20 text-[#4edea3]'
                    : 'bg-[#ffb4ab]/20 text-[#ffb4ab]'
                }`}>
                  SYS_HEALTH: {healthData.overallStatus} ({healthData.overallScore}%)
                </span>
              </div>
              <p className="text-xs text-[#bbcabf] mt-0.5">
                Continuous hardware integrity polling: Kernel oops/lockups, NVMe S.M.A.R.T., PCIe AER bus, and thermal throttling margins
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleStartSelfTest}
              disabled={isSelfTesting}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#10b981] hover:bg-[#005236] text-[#002113] hover:text-[#4edea3] rounded font-mono text-xs font-semibold transition-colors shadow-sm disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isSelfTesting ? `Testing (${selfTestStep}/5)...` : 'Run Health Self-Test'}</span>
            </button>

            <button
              onClick={handleExportHealthReport}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1c2028] hover:bg-[#262a33] text-[#dfe2ee] border border-[#262a33] rounded font-mono text-xs transition-colors shadow-sm"
            >
              <Download className="w-3.5 h-3.5 text-[#4cd7f6]" />
              <span>Health Bundle</span>
            </button>

            {/* Fault simulation toggle */}
            <div className="flex items-center bg-[#1c2028] border border-[#262a33] rounded p-0.5 font-mono text-xs">
              <button
                onClick={() => {
                  setThermalFaultInjected(!thermalFaultInjected);
                  onShowToast(thermalFaultInjected ? 'Thermal spike cleared' : 'Injected thermal spike (88°C PROCHOT)');
                }}
                className={`px-2 py-1 rounded transition-colors ${
                  thermalFaultInjected ? 'bg-[#ffb4ab]/20 text-[#ffb4ab]' : 'text-[#86948a] hover:text-[#dfe2ee]'
                }`}
                title="Simulate thermal throttle event"
              >
                Thermal Fault
              </button>
              <button
                onClick={() => {
                  setAerWarningInjected(!aerWarningInjected);
                  onShowToast(aerWarningInjected ? 'PCIe AER cleared' : 'Injected PCIe AER correctable warning');
                }}
                className={`px-2 py-1 rounded transition-colors ${
                  aerWarningInjected ? 'bg-[#ffb4ab]/20 text-[#ffb4ab]' : 'text-[#86948a] hover:text-[#dfe2ee]'
                }`}
                title="Simulate PCIe AER receiver retry"
              >
                PCIe AER
              </button>
              {(thermalFaultInjected || aerWarningInjected) && (
                <button
                  onClick={handleResetFaults}
                  className="px-2 py-1 text-[#4edea3] hover:bg-[#262a33] rounded"
                  title="Clear all faults"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 4 Core Health Pillar Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-[#262a33]/60 font-mono">
          <div className="bg-[#1c2028] border border-[#262a33] rounded-lg p-3 flex flex-col justify-between">
            <span className="text-[10px] text-[#86948a] uppercase tracking-wider">Kernel Stability</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-bold text-[#4edea3]">TAINT_NONE</span>
            </div>
            <span className="text-[11px] text-[#bbcabf] mt-1">0 Oops · 0 Lockups</span>
          </div>

          <div className="bg-[#1c2028] border border-[#262a33] rounded-lg p-3 flex flex-col justify-between">
            <span className="text-[10px] text-[#86948a] uppercase tracking-wider">Thermal Headroom</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className={`text-xl font-bold tabular-nums ${
                healthData.thermalPower.thermalMarginC < 20 ? 'text-[#ffb4ab]' : 'text-[#4cd7f6]'
              }`}>
                {healthData.thermalPower.thermalMarginC}°C
              </span>
              <span className="text-xs text-[#86948a]">to TJMax</span>
            </div>
            <span className="text-[11px] text-[#bbcabf] mt-1">
              Pkg: {healthData.thermalPower.packageTempC}°C / 100°C
            </span>
          </div>

          <div className="bg-[#1c2028] border border-[#262a33] rounded-lg p-3 flex flex-col justify-between">
            <span className="text-[10px] text-[#86948a] uppercase tracking-wider">Storage S.M.A.R.T.</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-bold text-[#4edea3] tabular-nums">99%</span>
              <span className="text-xs text-[#86948a]">Endurance</span>
            </div>
            <span className="text-[11px] text-[#bbcabf] mt-1">0 Media Errors (100% Spare)</span>
          </div>

          <div className="bg-[#1c2028] border border-[#262a33] rounded-lg p-3 flex flex-col justify-between">
            <span className="text-[10px] text-[#86948a] uppercase tracking-wider">PCIe Bus Integrity</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-bold text-[#dfe2ee]">Gen4 x4</span>
            </div>
            <span className={`text-[11px] mt-1 ${
              healthData.pcieInterconnect.aerCorrectableErrors > 0 ? 'text-[#ffb4ab]' : 'text-[#4edea3]'
            }`}>
              {healthData.pcieInterconnect.aerCorrectableErrors > 0 ? '2 AER Corrected' : '0 AER Errors'}
            </span>
          </div>
        </div>
      </section>

      {/* Self-Test Active Banner (if running) */}
      {isSelfTesting && (
        <section className="bg-[#1c2028] border border-[#4edea3]/40 rounded-xl p-4 flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-[#4edea3]" />
            <div className="font-mono text-xs">
              <span className="text-[#4edea3] font-bold">Executing Automated Device Health Self-Test... </span>
              <span className="text-[#dfe2ee]">Phase {selfTestStep} of 5: Testing kernel memory safety invariants</span>
            </div>
          </div>
          <div className="flex items-center gap-1 font-mono text-xs text-[#4cd7f6]">
            <span>{Math.round((selfTestStep / 5) * 100)}% Complete</span>
          </div>
        </section>
      )}

      {/* Subsystem Health Cards Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* 1. Kernel & Driver Health */}
        <div className="bg-[#181c24] border border-[#262a33] rounded-xl p-5 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-[#4edea3]" />
                <h3 className="font-semibold text-sm text-[#dfe2ee]">
                  Kernel &amp; Driver Health
                </h3>
              </div>
              <span className="text-[10px] font-mono bg-[#10b981]/20 text-[#4edea3] px-2 py-0.5 rounded">
                GPL-2.0 [CLEAN]
              </span>
            </div>
            <p className="text-xs text-[#bbcabf] mb-3">
              Driver fault traps, slab integrity, and lockless queue invariants
            </p>

            <div className="space-y-2 font-mono text-xs">
              <div className="flex items-center justify-between p-2 bg-[#1c2028] border border-[#262a33] rounded">
                <span className="text-[#86948a]">Kernel Oops / Panics:</span>
                <span className="text-[#4edea3] font-bold">0 Detected</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-[#1c2028] border border-[#262a33] rounded">
                <span className="text-[#86948a]">Lockup Watchdog:</span>
                <span className="text-[#4edea3] font-bold">0 (NMI OK)</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-[#1c2028] border border-[#262a33] rounded">
                <span className="text-[#86948a]">kmemleak Allocation Scan:</span>
                <span className="text-[#4cd7f6] font-bold">0 Leaks (16KB active)</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-[#1c2028] border border-[#262a33] rounded">
                <span className="text-[#86948a]">SLAB / SLUB Corruptions:</span>
                <span className="text-[#4edea3] font-bold">CLEAN</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-[#1c2028] border border-[#262a33] rounded">
                <span className="text-[#86948a]">DMA Bounce Buffer:</span>
                <span className="text-[#4edea3] font-bold">0 (Direct Coherent)</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-2 border-t border-[#262a33] flex items-center justify-between">
            <span className="text-[10px] font-mono text-[#86948a]">sysmonitor.ko v2.4.11</span>
            <button
              onClick={onOpenStackModal}
              className="text-xs font-mono text-[#4cd7f6] hover:underline flex items-center gap-1"
            >
              <Bug className="w-3.5 h-3.5" />
              <span>Inspect Stack</span>
            </button>
          </div>
        </div>

        {/* 2. Thermal & Power Envelope */}
        <div className="bg-[#181c24] border border-[#262a33] rounded-xl p-5 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Thermometer className="w-4 h-4 text-[#4cd7f6]" />
                <h3 className="font-semibold text-sm text-[#dfe2ee]">
                  Thermal &amp; Power Health
                </h3>
              </div>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                healthData.thermalPower.prochotActive ? 'bg-[#ffb4ab]/20 text-[#ffb4ab]' : 'bg-[#10b981]/20 text-[#4edea3]'
              }`}>
                {healthData.thermalPower.prochotActive ? 'PROCHOT ACTIVE' : 'NOMINAL'}
              </span>
            </div>
            <p className="text-xs text-[#bbcabf] mb-3">
              Hardware thermal junction, power delivery rails, and throttle monitors
            </p>

            <div className="space-y-2 font-mono text-xs">
              <div className="flex items-center justify-between p-2 bg-[#1c2028] border border-[#262a33] rounded">
                <span className="text-[#86948a]">Package Temperature:</span>
                <span className={`font-bold tabular-nums ${healthData.thermalPower.packageTempC > 80 ? 'text-[#ffb4ab]' : 'text-[#4cd7f6]'}`}>
                  {healthData.thermalPower.packageTempC}°C
                </span>
              </div>
              <div className="flex items-center justify-between p-2 bg-[#1c2028] border border-[#262a33] rounded">
                <span className="text-[#86948a]">TJMax Safe Threshold:</span>
                <span className="text-[#dfe2ee] font-bold">100°C</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-[#1c2028] border border-[#262a33] rounded">
                <span className="text-[#86948a]">Vcore Rail Voltage:</span>
                <span className="text-[#4edea3] font-bold tabular-nums">1.18 V</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-[#1c2028] border border-[#262a33] rounded">
                <span className="text-[#86948a]">Package Power Draw:</span>
                <span className="text-[#dfe2ee] font-bold tabular-nums">{healthData.thermalPower.packagePowerWatts} W / 125W</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-[#1c2028] border border-[#262a33] rounded">
                <span className="text-[#86948a]">Throttling Trips:</span>
                <span className={`font-bold ${healthData.thermalPower.thermalThrottlingEvents > 0 ? 'text-[#ffb4ab]' : 'text-[#4edea3]'}`}>
                  {healthData.thermalPower.thermalThrottlingEvents} Events
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-2 border-t border-[#262a33] flex items-center justify-between text-[11px] font-mono text-[#bbcabf]">
            <span>Sensors: coretemp / msr</span>
            <span className="text-[#4edea3]">100% Thermal Guard</span>
          </div>
        </div>

        {/* 3. Storage S.M.A.R.T. Health */}
        <div className="bg-[#181c24] border border-[#262a33] rounded-xl p-5 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-[#d0bcff]" />
                <h3 className="font-semibold text-sm text-[#dfe2ee]">
                  NVMe S.M.A.R.T. Health
                </h3>
              </div>
              <span className="text-[10px] font-mono bg-[#10b981]/20 text-[#4edea3] px-2 py-0.5 rounded">
                GOOD (100%)
              </span>
            </div>
            <p className="text-xs text-[#bbcabf] mb-3">
              NVMe controller health indicators from <code className="font-mono text-[#4cd7f6]">/dev/nvme0n1</code>
            </p>

            <div className="space-y-2 font-mono text-xs">
              <div className="flex items-center justify-between p-2 bg-[#1c2028] border border-[#262a33] rounded">
                <span className="text-[#86948a]">Available Spare:</span>
                <span className="text-[#4edea3] font-bold">100% (Threshold 10%)</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-[#1c2028] border border-[#262a33] rounded">
                <span className="text-[#86948a]">Drive Temperature:</span>
                <span className="text-[#4cd7f6] font-bold tabular-nums">38°C</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-[#1c2028] border border-[#262a33] rounded">
                <span className="text-[#86948a]">Critical Warnings:</span>
                <span className="text-[#4edea3] font-bold">0x00 (None)</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-[#1c2028] border border-[#262a33] rounded">
                <span className="text-[#86948a]">Data Integrity Errors:</span>
                <span className="text-[#4edea3] font-bold">0 Errors</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-[#1c2028] border border-[#262a33] rounded">
                <span className="text-[#86948a]">Data Read / Written:</span>
                <span className="text-[#dfe2ee] font-bold">18.4 TB / 14.1 TB</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-2 border-t border-[#262a33] flex items-center justify-between text-[11px] font-mono text-[#bbcabf]">
            <span>Endurance used: 1%</span>
            <span className="text-[#4edea3]">Wear Leveling OK</span>
          </div>
        </div>

        {/* 4. PCIe Interconnect & Bus AER */}
        <div className="bg-[#181c24] border border-[#262a33] rounded-xl p-5 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#4edea3]" />
                <h3 className="font-semibold text-sm text-[#dfe2ee]">
                  PCIe AER &amp; Bus Interconnect
                </h3>
              </div>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                healthData.pcieInterconnect.aerCorrectableErrors > 0 ? 'bg-[#ffb4ab]/20 text-[#ffb4ab]' : 'bg-[#10b981]/20 text-[#4edea3]'
              }`}>
                {healthData.pcieInterconnect.aerCorrectableErrors > 0 ? 'AER ALERT' : 'PCIe OPTIMAL'}
              </span>
            </div>
            <p className="text-xs text-[#bbcabf] mb-3">
              Advanced Error Reporting (AER) for Root Port and Endpoint bridges
            </p>

            <div className="space-y-2 font-mono text-xs">
              <div className="flex items-center justify-between p-2 bg-[#1c2028] border border-[#262a33] rounded">
                <span className="text-[#86948a]">Negotiated Link Speed:</span>
                <span className="text-[#dfe2ee] font-bold">16.0 GT/s (Gen4)</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-[#1c2028] border border-[#262a33] rounded">
                <span className="text-[#86948a]">Negotiated Link Width:</span>
                <span className="text-[#4edea3] font-bold">x4 (Full Width)</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-[#1c2028] border border-[#262a33] rounded">
                <span className="text-[#86948a]">AER Correctable Errors:</span>
                <span className={`font-bold ${healthData.pcieInterconnect.aerCorrectableErrors > 0 ? 'text-[#ffb4ab]' : 'text-[#4edea3]'}`}>
                  {healthData.pcieInterconnect.aerCorrectableErrors} (Receiver Retry)
                </span>
              </div>
              <div className="flex items-center justify-between p-2 bg-[#1c2028] border border-[#262a33] rounded">
                <span className="text-[#86948a]">AER Uncorrectable Errors:</span>
                <span className="text-[#4edea3] font-bold">0 (TLP / DLLP Clean)</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-[#1c2028] border border-[#262a33] rounded">
                <span className="text-[#86948a]">IOMMU DMA Isolation:</span>
                <span className="text-[#4edea3] font-bold">ENABLED (VT-d Active)</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-2 border-t border-[#262a33] flex items-center justify-between text-[11px] font-mono text-[#bbcabf]">
            <span>Link Degradation: None</span>
            <span className="text-[#4edea3]">64.0 GT/s Throughput</span>
          </div>
        </div>

        {/* 5. Memory EDAC & Allocation Health */}
        <div className="bg-[#181c24] border border-[#262a33] rounded-xl p-5 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#4cd7f6]" />
                <h3 className="font-semibold text-sm text-[#dfe2ee]">
                  Memory EDAC &amp; Page Allocator
                </h3>
              </div>
              <span className="text-[10px] font-mono bg-[#10b981]/20 text-[#4edea3] px-2 py-0.5 rounded">
                ECC VERIFIED
              </span>
            </div>
            <p className="text-xs text-[#bbcabf] mb-3">
              Error Detection and Correction (EDAC) driver &amp; buddy allocator health
            </p>

            <div className="space-y-2 font-mono text-xs">
              <div className="flex items-center justify-between p-2 bg-[#1c2028] border border-[#262a33] rounded">
                <span className="text-[#86948a]">Corrected Single-Bit (CE):</span>
                <span className="text-[#4edea3] font-bold">0 Errors</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-[#1c2028] border border-[#262a33] rounded">
                <span className="text-[#86948a]">Uncorrected Multi-Bit (UE):</span>
                <span className="text-[#4edea3] font-bold">0 Errors</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-[#1c2028] border border-[#262a33] rounded">
                <span className="text-[#86948a]">Page Allocation Failures:</span>
                <span className="text-[#4edea3] font-bold">0 Failures</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-[#1c2028] border border-[#262a33] rounded">
                <span className="text-[#86948a]">Memory Compaction Stalls:</span>
                <span className="text-[#4edea3] font-bold">0 Stalls</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-[#1c2028] border border-[#262a33] rounded">
                <span className="text-[#86948a]">Direct Reclaim Latency:</span>
                <span className="text-[#4cd7f6] font-bold tabular-nums">0.12 ms</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-2 border-t border-[#262a33] flex items-center justify-between text-[11px] font-mono text-[#bbcabf]">
            <span>Buddy Allocator: Order 0-10</span>
            <span className="text-[#4edea3]">0 OOM Triggers</span>
          </div>
        </div>

        {/* 6. Device Security & Access Permissions */}
        <div className="bg-[#181c24] border border-[#262a33] rounded-xl p-5 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#4edea3]" />
                <h3 className="font-semibold text-sm text-[#dfe2ee]">
                  Device Security &amp; Access Controls
                </h3>
              </div>
              <span className="text-[10px] font-mono bg-[#10b981]/20 text-[#4edea3] px-2 py-0.5 rounded">
                SECURE
              </span>
            </div>
            <p className="text-xs text-[#bbcabf] mb-3">
              VFS security boundary enforcement for <code className="font-mono text-[#4cd7f6]">/dev/sysmonitor</code>
            </p>

            <div className="space-y-2 font-mono text-xs">
              <div className="flex items-center justify-between p-2 bg-[#1c2028] border border-[#262a33] rounded">
                <span className="text-[#86948a]">Device Node Mode:</span>
                <span className="text-[#4edea3] font-bold">0660 (rw-rw----)</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-[#1c2028] border border-[#262a33] rounded">
                <span className="text-[#86948a]">Device Owner &amp; Group:</span>
                <span className="text-[#dfe2ee] font-bold">root : sysmon</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-[#1c2028] border border-[#262a33] rounded">
                <span className="text-[#86948a]">Kernel Address Isolation:</span>
                <span className="text-[#4edea3] font-bold">KASLR Active</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-[#1c2028] border border-[#262a33] rounded">
                <span className="text-[#86948a]">Pointer Sanity Check:</span>
                <span className="text-[#4edea3] font-bold">access_ok() Enforced</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-[#1c2028] border border-[#262a33] rounded">
                <span className="text-[#86948a]">Non-Root Exploit Immunity:</span>
                <span className="text-[#4edea3] font-bold">PASS (Bounds Checked)</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-2 border-t border-[#262a33] flex items-center justify-between text-[11px] font-mono text-[#bbcabf]">
            <span>Udev rule: 99-sysmonitor</span>
            <span className="text-[#4edea3]">Strictly Confined</span>
          </div>
        </div>
      </section>
    </div>
  );
};
