export type LogLevel = 'EMERG' | 'ALERT' | 'CRIT' | 'ERR' | 'WARNING' | 'NOTICE' | 'INFO' | 'DEBUG';
export type Subsystem = 'all' | 'sysmonitor' | 'sched' | 'mm' | 'irq' | 'net' | 'vfs';

export interface KernelLog {
  id: string;
  timestamp: number; // e.g. 1421.100910
  level: LogLevel;
  subsystem: Subsystem;
  message: string;
  isDriver?: boolean;
}

export interface CpuCoreStat {
  coreId: number;
  freqMHz: number;
  userPct: number;
  sysPct: number;
  iowaitPct: number;
  irqPct: number;
  idlePct: number;
  tempC: number;
}

export interface MemoryStat {
  totalKiB: number;
  freeKiB: number;
  availableKiB: number;
  cachedKiB: number;
  activeSlabKiB: number;
  slabAllocations: {
    name: string;
    items: number;
    sizeBytes: number;
    activePct: number;
  }[];
}

export interface ProcessStat {
  pid: number;
  ppid: number;
  comm: string;
  state: 'TASK_RUNNING' | 'TASK_INTERRUPTIBLE' | 'TASK_UNINTERRUPTIBLE' | 'TASK_STOPPED' | 'TASK_ZOMBIE';
  cpuAffinity: string; // e.g. "0x0F"
  prio: number;
  vctx: number;  // voluntary context switches
  ivctx: number; // involuntary context switches
  rssKb: number;
  cpuPct: number;
}

export interface IrqStat {
  vector: number;
  name: string;
  type: 'PCI-MSI' | 'Timer' | 'IPI' | 'Local-APIC' | 'CharDev-KMod';
  affinityCpu: number;
  countsPerCore: number[];
}

export interface CharDevState {
  node: string;
  major: number;
  minor: number;
  devT: string;
  openCount: number;
  totalReads: number;
  totalWrites: number;
  totalIoctls: number;
  ringBufferSizeKiB: number;
  ringBufferUsedPct: number;
  ringDrops: number;
  lastIoctlCmd: string;
  lastIoctlArg: string;
  lastIoctlLatencyUs: number;
  lastIoctlStatus: 'SUCCESS' | 'EINVAL' | 'EFAULT' | 'EBUSY';
}

export interface BlueprintStep {
  stepNumber: number;
  title: string;
  tagline: string;
  subsystem: 'Foundation' | 'Kernel Module' | 'Char Device' | 'C++ Daemon' | 'Telemetry Engine' | 'Verification & Docs';
  objective: string;
  prerequisites: string[];
  keyConcepts: string[];
  shellCommands: string[];
  codeFiles: {
    filename: string;
    language: string;
    path: string;
    code: string;
    description: string;
  }[];
  verificationSteps: {
    command: string;
    expectedOutput: string;
    notes: string;
  }[];
  status: 'READY' | 'VERIFIED';
}

export interface DemoStep {
  phase: number;
  title: string;
  durationSec: number;
  description: string;
  terminalCommand: string;
  terminalLogs: string[];
  verificationBadge: string;
}

export interface DeviceHealthTelemetry {
  overallScore: number;
  overallStatus: 'OPTIMAL' | 'DEGRADED' | 'CRITICAL';
  kernelDiagnostics: {
    oopsCount: number;
    panicCount: number;
    softLockups: number;
    hardLockups: number;
    kmemleakLeaks: number;
    kmemleakAllocatedKiB: number;
    slabCorruptions: number;
    moduleTaint: string;
    refCount: number;
    dmaBounceBufferCount: number;
  };
  thermalPower: {
    packageTempC: number;
    tjMaxC: number;
    thermalMarginC: number;
    thermalThrottlingEvents: number;
    prochotActive: boolean;
    vcoreVoltage: number;
    packagePowerWatts: number;
    tdpLimitWatts: number;
  };
  storageSmart: {
    deviceNode: string;
    model: string;
    temperatureC: number;
    availableSparePct: number;
    availableSpareThresholdPct: number;
    percentageUsed: number;
    criticalWarnings: number;
    dataIntegrityErrors: number;
    powerCycles: number;
    unsafeShutdowns: number;
    hostReadTB: number;
    hostWrittenTB: number;
  };
  pcieInterconnect: {
    device: string;
    currentLinkSpeed: string;
    currentLinkWidth: string;
    aerCorrectableErrors: number;
    aerUncorrectableErrors: number;
    aerFatalErrors: number;
    iommuEnabled: boolean;
  };
  eccMemory: {
    edacCorrectedErrors: number;
    edacUncorrectedErrors: number;
    pageAllocFailures: number;
    compactionStalls: number;
    directReclaimLatencyMs: number;
  };
}
