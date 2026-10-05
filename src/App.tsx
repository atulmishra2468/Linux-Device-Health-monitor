import React, { useState } from 'react';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { Header } from './components/Header';
import { LogsRingBufferView } from './components/LogsRingBufferView';
import { OverviewTelemetryView } from './components/OverviewTelemetryView';
import { DeviceHealthMonitorView } from './components/DeviceHealthMonitorView';
import { CharDevInterfaceView } from './components/CharDevInterfaceView';
import { ProcessesIrqView } from './components/ProcessesIrqView';
import { BlueprintStepsView } from './components/BlueprintStepsView';
import { StackTraceModal } from './components/StackTraceModal';
import { SourceCodeModal } from './components/SourceCodeModal';
import { Toast } from './components/Toast';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('logs');
  const [isStressed, setIsStressed] = useState<boolean>(false);
  const [isStackModalOpen, setIsStackModalOpen] = useState<boolean>(false);
  const [isSourceModalOpen, setIsSourceModalOpen] = useState<boolean>(false);
  const [sourceModalInitialFile, setSourceModalInitialFile] = useState<string>('sysmonitor_c');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  const handleOpenSourceWithFile = (fileId: string) => {
    setSourceModalInitialFile(fileId);
    setIsSourceModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#0f131c] text-[#dfe2ee] font-sans antialiased selection:bg-[#10b981]/30 selection:text-[#4edea3]">
      {/* Left Sidebar (Matching Screenshot) */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenStackModal={() => setIsStackModalOpen(true)}
      />

      {/* Main Content Area (offset by 72px * 4 = 288px / pl-72) */}
      <div className="pl-72 flex flex-col min-h-screen">
        {/* Top Header Bar */}
        <Header
          onStartDemo={() => {
            setActiveTab('blueprint');
          }}
          onToggleStress={() => {
            const next = !isStressed;
            setIsStressed(next);
            showToast(next ? 'Synthetic CFS stress load injected on Core #7' : 'Synthetic stress load stopped');
          }}
          isStressed={isStressed}
          setActiveTab={setActiveTab}
        />

        {/* Viewport Content */}
        <main className="relative pt-20 pb-12 px-6 w-full flex-1">
          {activeTab === 'logs' && (
            <LogsRingBufferView
              onOpenStackModal={() => setIsStackModalOpen(true)}
              onShowToast={showToast}
              isStressed={isStressed}
            />
          )}

          {activeTab === 'overview' && (
            <OverviewTelemetryView
              isStressed={isStressed}
              onToggleStress={() => {
                const next = !isStressed;
                setIsStressed(next);
                showToast(next ? 'Synthetic load injected on CFS runqueue' : 'Workload normalised');
              }}
              onShowToast={showToast}
            />
          )}

          {activeTab === 'health' && (
            <DeviceHealthMonitorView
              onShowToast={showToast}
              onOpenStackModal={() => setIsStackModalOpen(true)}
              isStressed={isStressed}
            />
          )}

          {activeTab === 'chardev' && (
            <CharDevInterfaceView onShowToast={showToast} />
          )}

          {activeTab === 'processes' && (
            <ProcessesIrqView onShowToast={showToast} isStressed={isStressed} />
          )}

          {activeTab === 'blueprint' && (
            <BlueprintStepsView
              onShowToast={showToast}
              onOpenSourceModalWithFile={handleOpenSourceWithFile}
            />
          )}

          {activeTab === 'code' && (
            <div className="bg-[#181c24] border border-[#262a33] rounded-xl p-6 shadow-md">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-[#dfe2ee]">
                    Direct Driver &amp; Daemon Source Code Inspector
                  </h2>
                  <p className="text-xs text-[#bbcabf] font-mono mt-0.5">
                    Explore compilable C Linux kernel module and modern C++20 userland daemon
                  </p>
                </div>
                <button
                  onClick={() => setIsSourceModalOpen(true)}
                  className="px-4 py-2 bg-[#10b981] hover:bg-[#005236] text-[#002113] hover:text-[#4edea3] rounded font-mono text-xs font-semibold transition-colors"
                >
                  Open Full Screen Code Browser
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
                <div className="bg-[#1c2028] p-4 rounded-lg border border-[#262a33] flex flex-col justify-between">
                  <div>
                    <span className="text-[#4edea3] font-bold text-sm">driver/sysmonitor.c</span>
                    <p className="text-[#bbcabf] text-xs mt-1">
                      Full character device driver with alloc_chrdev_region, cdev_init, device_create, unlocked_ioctl, and mmap zero-copy handlers.
                    </p>
                  </div>
                  <button
                    onClick={() => handleOpenSourceWithFile('sysmonitor_c')}
                    className="mt-4 px-3 py-1.5 bg-[#262a33] hover:bg-[#31353e] text-[#4edea3] rounded self-start border border-[#262a33]"
                  >
                    View sysmonitor.c
                  </button>
                </div>

                <div className="bg-[#1c2028] p-4 rounded-lg border border-[#262a33] flex flex-col justify-between">
                  <div>
                    <span className="text-[#4cd7f6] font-bold text-sm">daemon/sysmonitor_daemon.cpp</span>
                    <p className="text-[#bbcabf] text-xs mt-1">
                      High-throughput modern C++20 daemon managing /dev/sysmonitor via RAII and zero-copy mmap circular buffer.
                    </p>
                  </div>
                  <button
                    onClick={() => handleOpenSourceWithFile('sysmonitor_daemon_cpp')}
                    className="mt-4 px-3 py-1.5 bg-[#262a33] hover:bg-[#31353e] text-[#4cd7f6] rounded self-start border border-[#262a33]"
                  >
                    View sysmonitor_daemon.cpp
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Kernel Call Stack Verification Inspector Modal (Image 1) */}
      <StackTraceModal
        isOpen={isStackModalOpen}
        onClose={() => setIsStackModalOpen(false)}
      />

      {/* Source Code Modal */}
      <SourceCodeModal
        isOpen={isSourceModalOpen}
        onClose={() => setIsSourceModalOpen(false)}
        initialFileId={sourceModalInitialFile}
        onShowToast={showToast}
      />

      {/* Floating Toast Notification */}
      <Toast message={toastMessage} />
    </div>
  );
}
