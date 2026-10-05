import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  CheckCircle2, 
  Terminal, 
  Copy, 
  Download, 
  Play, 
  Pause, 
  RotateCcw, 
  ChevronRight, 
  ChevronLeft, 
  Layers, 
  FileCode, 
  Sparkles, 
  ShieldCheck,
  Check,
  Cpu
} from 'lucide-react';
import { BLUEPRINT_STEPS, DEMO_PHASES } from '../data/stepsData';
import { BlueprintStep, DemoStep } from '../types/sysmonitor';

interface BlueprintStepsViewProps {
  onShowToast: (msg: string) => void;
  onOpenSourceModalWithFile: (fileId: string) => void;
  initialStep?: number;
}

export const BlueprintStepsView: React.FC<BlueprintStepsViewProps> = ({
  onShowToast,
  onOpenSourceModalWithFile,
  initialStep = 1,
}) => {
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(initialStep - 1);
  const [activeTab, setActiveTab] = useState<'walkthrough' | 'demo'>('walkthrough');
  const [copiedCmdIdx, setCopiedCmdIdx] = useState<number | null>(null);

  // Demo runner state
  const [currentPhaseIdx, setCurrentPhaseIdx] = useState<number>(0);
  const [isDemoRunning, setIsDemoRunning] = useState<boolean>(false);
  const [demoElapsedTime, setDemoElapsedTime] = useState<number>(0);

  const step = BLUEPRINT_STEPS[currentStepIdx] || BLUEPRINT_STEPS[0];
  const demoPhase = DEMO_PHASES[currentPhaseIdx];

  // Auto-play demo runner
  useEffect(() => {
    let interval: any;
    if (isDemoRunning) {
      interval = setInterval(() => {
        setDemoElapsedTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isDemoRunning]);

  useEffect(() => {
    if (!isDemoRunning) return;

    const currentLimit = DEMO_PHASES[currentPhaseIdx].durationSec;
    if (demoElapsedTime >= currentLimit) {
      if (currentPhaseIdx < DEMO_PHASES.length - 1) {
        setCurrentPhaseIdx((prev) => prev + 1);
        setDemoElapsedTime(0);
        onShowToast(`Advanced to Demo Phase ${currentPhaseIdx + 2}: ${DEMO_PHASES[currentPhaseIdx + 1].title}`);
      } else {
        setIsDemoRunning(false);
        onShowToast('5-10 Minute Demonstration Showcase Completed Successfully!');
      }
    }
  }, [demoElapsedTime, currentPhaseIdx, isDemoRunning, onShowToast]);

  const handleCopyCommand = (cmdText: string, idx: number) => {
    navigator.clipboard.writeText(cmdText);
    setCopiedCmdIdx(idx);
    onShowToast('Copied shell command to clipboard');
    setTimeout(() => setCopiedCmdIdx(null), 2000);
  };

  const handleNextStep = () => {
    if (currentStepIdx < BLUEPRINT_STEPS.length - 1) {
      setCurrentStepIdx(currentStepIdx + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStepIdx > 0) {
      setCurrentStepIdx(currentStepIdx - 1);
    }
  };

  return (
    <div className="flex flex-col w-full gap-6 select-text">
      {/* Top Banner & Mode Toggle */}
      <section className="bg-[#181c24] border border-[#262a33] rounded-xl p-5 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#4cd7f6]/10 border border-[#4cd7f6]/30 text-[#4cd7f6] flex items-center justify-center">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-base text-[#dfe2ee]">
                15-Step Kernel Driver &amp; Observability Blueprint
              </h2>
              <span className="px-2 py-0.5 rounded bg-[#10b981]/20 text-[#4edea3] font-mono text-xs font-semibold">
                15 / 15 VERIFIED
              </span>
            </div>
            <p className="text-xs text-[#bbcabf] mt-0.5">
              Production engineering curriculum from bare-metal headers to high-throughput zero-copy userland telemetry
            </p>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center bg-[#0a0e16] border border-[#262a33] rounded-lg p-1 font-mono text-xs">
          <button
            onClick={() => setActiveTab('walkthrough')}
            className={`px-3 py-1.5 rounded transition-colors ${
              activeTab === 'walkthrough'
                ? 'bg-[#262a33] text-[#4edea3] font-semibold'
                : 'text-[#bbcabf] hover:text-[#dfe2ee]'
            }`}
          >
            Step-by-Step Curriculum
          </button>
          <button
            onClick={() => setActiveTab('demo')}
            className={`px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 ${
              activeTab === 'demo'
                ? 'bg-[#10b981] text-[#002113] font-semibold'
                : 'text-[#bbcabf] hover:text-[#dfe2ee]'
            }`}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Step 15: Live 5-10m Demo</span>
          </button>
        </div>
      </section>

      {/* Main Content Body */}
      {activeTab === 'walkthrough' ? (
        <div className="grid grid-cols-12 gap-6">
          {/* Left Column: 15-Step Navigator */}
          <div className="col-span-12 lg:col-span-4 flex flex-col gap-2">
            <div className="bg-[#181c24] border border-[#262a33] rounded-xl p-3 shadow-md flex flex-col gap-1 max-h-[780px] overflow-y-auto terminal-scroll">
              <div className="font-mono text-[10px] text-[#86948a] uppercase tracking-wider px-2 py-1">
                Engineering Sequence
              </div>
              {BLUEPRINT_STEPS.map((s, idx) => {
                const isCurrent = idx === currentStepIdx;
                return (
                  <button
                    key={s.stepNumber}
                    onClick={() => setCurrentStepIdx(idx)}
                    className={`flex items-start gap-2.5 p-2.5 rounded-lg text-left transition-colors font-mono ${
                      isCurrent
                        ? 'bg-[#262a33] border-l-2 border-[#4edea3] text-[#dfe2ee]'
                        : 'hover:bg-[#1c2028] text-[#bbcabf]'
                    }`}
                  >
                    <span className={`text-xs font-bold shrink-0 ${isCurrent ? 'text-[#4edea3]' : 'text-[#86948a]'}`}>
                      STEP {s.stepNumber < 10 ? `0${s.stepNumber}` : s.stepNumber}
                    </span>
                    <div className="flex flex-col min-w-0">
                      <span className={`text-xs truncate ${isCurrent ? 'font-bold text-[#dfe2ee]' : 'text-[#bbcabf]'}`}>
                        {s.title}
                      </span>
                      <span className="text-[10px] text-[#86948a] truncate mt-0.5">
                        {s.tagline}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Step Deep Dive */}
          <div className="col-span-12 lg:col-span-8 flex flex-col gap-4">
            <div className="bg-[#181c24] border border-[#262a33] rounded-xl p-6 shadow-md flex flex-col gap-5">
              {/* Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#262a33] pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-[#4cd7f6]/10 text-[#4cd7f6] font-mono text-xs font-bold">
                      STEP {step.stepNumber} of 15
                    </span>
                    <span className="text-xs font-mono text-[#86948a]">
                      [{step.subsystem}]
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-[#dfe2ee] mt-1">
                    {step.title}
                  </h3>
                  <p className="text-sm text-[#4edea3] font-mono mt-0.5">
                    {step.tagline}
                  </p>
                </div>

                {/* Step navigation prev/next */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrevStep}
                    disabled={currentStepIdx === 0}
                    className="p-2 bg-[#1c2028] hover:bg-[#262a33] disabled:opacity-30 rounded border border-[#262a33] text-[#dfe2ee] transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="font-mono text-xs text-[#bbcabf] px-1">
                    {step.stepNumber} / 15
                  </span>
                  <button
                    onClick={handleNextStep}
                    disabled={currentStepIdx === BLUEPRINT_STEPS.length - 1}
                    className="p-2 bg-[#1c2028] hover:bg-[#262a33] disabled:opacity-30 rounded border border-[#262a33] text-[#dfe2ee] transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Objective */}
              <div className="bg-[#1c2028] border border-[#262a33] rounded-lg p-4">
                <span className="text-xs font-mono text-[#86948a] uppercase block mb-1">
                  Step Objective
                </span>
                <p className="text-sm text-[#dfe2ee] leading-relaxed">
                  {step.objective}
                </p>
              </div>

              {/* Key Kernel Concepts */}
              <div>
                <span className="text-xs font-mono text-[#86948a] uppercase block mb-2">
                  Architectural &amp; Kernel Concepts
                </span>
                <ul className="space-y-1.5 text-xs text-[#bbcabf]">
                  {step.keyConcepts.map((kc, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-[#4edea3] mt-0.5">•</span>
                      <span>{kc}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Shell Commands Terminal */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-[#86948a] uppercase">
                    Shell Commands
                  </span>
                  <button
                    onClick={() => handleCopyCommand(step.shellCommands.join('\n'), -1)}
                    className="text-xs font-mono text-[#4cd7f6] hover:underline flex items-center gap-1"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy All</span>
                  </button>
                </div>
                <div className="bg-[#0a0e16] border border-[#1c2028] rounded-lg p-3 font-mono text-xs space-y-1 overflow-x-auto text-[#dfe2ee]">
                  {step.shellCommands.map((cmd, i) => (
                    <div key={i} className="flex items-center justify-between hover:bg-[#1c2028]/50 px-1 py-0.5 rounded group">
                      <span className={cmd.startsWith('#') ? 'text-[#86948a]' : 'text-[#dfe2ee]'}>
                        {cmd}
                      </span>
                      {cmd && !cmd.startsWith('#') && (
                        <button
                          onClick={() => handleCopyCommand(cmd, i)}
                          className="opacity-0 group-hover:opacity-100 text-[#4edea3] transition-opacity ml-2"
                        >
                          {copiedCmdIdx === i ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Code Artifacts */}
              {step.codeFiles.length > 0 && (
                <div>
                  <span className="text-xs font-mono text-[#86948a] uppercase block mb-2">
                    Implementation Code File ({step.codeFiles[0].filename})
                  </span>
                  <div className="bg-[#0a0e16] border border-[#1c2028] rounded-lg overflow-hidden">
                    <div className="px-3 py-1.5 bg-[#1c2028] border-b border-[#262a33] flex items-center justify-between text-xs font-mono text-[#bbcabf]">
                      <span>{step.codeFiles[0].path}</span>
                      <button
                        onClick={() => onOpenSourceModalWithFile('sysmonitor_c')}
                        className="text-[#4cd7f6] hover:underline flex items-center gap-1"
                      >
                        <FileCode className="w-3.5 h-3.5" />
                        <span>Inspect in Full Editor</span>
                      </button>
                    </div>
                    <pre className="p-3 font-mono text-xs text-[#dfe2ee] leading-relaxed max-h-56 overflow-y-auto terminal-scroll">
                      <code>{step.codeFiles[0].code}</code>
                    </pre>
                  </div>
                </div>
              )}

              {/* Verification & Expected Output */}
              <div className="bg-[#1c2028] border border-[#262a33] rounded-lg p-4 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-[#4edea3] font-semibold flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Verification Test</span>
                  </span>
                  <span className="text-[11px] font-mono text-[#bbcabf]">
                    {step.verificationSteps[0].notes}
                  </span>
                </div>
                <div className="bg-[#0a0e16] border border-[#262a33] p-2.5 rounded font-mono text-xs space-y-1">
                  <div className="text-[#86948a]">$ {step.verificationSteps[0].command}</div>
                  <pre className="text-[#4edea3] leading-relaxed select-text">
                    {step.verificationSteps[0].expectedOutput}
                  </pre>
                </div>
              </div>

              {/* Next Step CTA */}
              <div className="pt-2 flex items-center justify-between">
                <span className="text-xs font-mono text-[#86948a]">
                  Status: {step.status}
                </span>
                {currentStepIdx < BLUEPRINT_STEPS.length - 1 ? (
                  <button
                    onClick={handleNextStep}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[#10b981] hover:bg-[#005236] text-[#002113] hover:text-[#4edea3] rounded font-mono text-xs font-semibold transition-colors"
                  >
                    <span>Proceed to Step {step.stepNumber + 1}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => setActiveTab('demo')}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[#4cd7f6] hover:bg-[#004e5c] text-[#001f26] hover:text-[#acedff] rounded font-mono text-xs font-bold transition-colors shadow-md"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Launch 5-10 Min Live Demonstration</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* STEP 15: Interactive Live Demonstration Showcase */
        <div className="flex flex-col gap-6">
          {/* Demo Control Card */}
          <div className="bg-[#181c24] border border-[#262a33] rounded-xl p-6 shadow-md flex flex-col gap-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-[#10b981]/20 text-[#4edea3] font-mono text-xs font-bold">
                    STEP 15 DEMO RUNNER
                  </span>
                  <span className="text-xs font-mono text-[#bbcabf]">
                    Phase {currentPhaseIdx + 1} of 6
                  </span>
                </div>
                <h3 className="text-xl font-bold text-[#dfe2ee] mt-1">
                  {demoPhase.title}
                </h3>
                <p className="text-xs text-[#bbcabf] mt-0.5">
                  {demoPhase.description}
                </p>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsDemoRunning(!isDemoRunning)}
                  className={`flex items-center gap-2 px-4 py-2 rounded font-mono text-xs font-bold transition-all shadow-md ${
                    isDemoRunning
                      ? 'bg-[#ffb4ab]/20 text-[#ffb4ab] border border-[#ffb4ab]/40'
                      : 'bg-[#10b981] hover:bg-[#005236] text-[#002113] hover:text-[#4edea3]'
                  }`}
                >
                  {isDemoRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                  <span>{isDemoRunning ? 'Pause Demo' : 'Play Live Demo'}</span>
                </button>

                <button
                  onClick={() => {
                    setIsDemoRunning(false);
                    setCurrentPhaseIdx(0);
                    setDemoElapsedTime(0);
                    onShowToast('Demonstration reset to Phase 1');
                  }}
                  className="p-2 bg-[#1c2028] hover:bg-[#262a33] text-[#bbcabf] rounded border border-[#262a33] transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Phase Stepper Tabs */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-2 pt-2 border-t border-[#262a33]">
              {DEMO_PHASES.map((p, idx) => {
                const isActive = idx === currentPhaseIdx;
                const isPast = idx < currentPhaseIdx;
                return (
                  <button
                    key={p.phase}
                    onClick={() => {
                      setCurrentPhaseIdx(idx);
                      setDemoElapsedTime(0);
                    }}
                    className={`p-2.5 rounded-lg text-left font-mono transition-colors border ${
                      isActive
                        ? 'bg-[#262a33] border-[#4edea3] text-[#dfe2ee]'
                        : isPast
                        ? 'bg-[#1c2028] border-[#262a33] text-[#4edea3]'
                        : 'bg-[#1c2028] border-[#262a33] text-[#86948a]'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px]">
                      <span>PHASE {p.phase}</span>
                      {isPast && <CheckCircle2 className="w-3 h-3 text-[#4edea3]" />}
                    </div>
                    <span className="text-[11px] truncate block font-semibold mt-1">
                      {p.verificationBadge}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Terminal Console View for Active Phase */}
          <div className="bg-[#0a0e16] border border-[#1c2028] rounded-xl shadow-xl overflow-hidden flex flex-col">
            <div className="px-4 py-2.5 bg-[#181c24] border-b border-[#262a33] flex items-center justify-between text-xs font-mono text-[#bbcabf]">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-[#4edea3] animate-pulse"></span>
                <span className="text-[#dfe2ee] font-bold">
                  $ {demoPhase.terminalCommand}
                </span>
              </div>
              <span className="text-[#4cd7f6]">{demoPhase.verificationBadge}</span>
            </div>

            <div className="p-4 space-y-1.5 font-mono text-xs leading-relaxed select-text min-h-[300px]">
              {demoPhase.terminalLogs.map((log, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-[#86948a] shrink-0">&gt;</span>
                  <span className={log.includes('SUCCESS') || log.includes('OK') ? 'text-[#4edea3] font-semibold' : 'text-[#dfe2ee]'}>
                    {log}
                  </span>
                </div>
              ))}
            </div>

            <div className="px-4 py-2 bg-[#181c24] border-t border-[#262a33] flex items-center justify-between text-xs font-mono text-[#86948a]">
              <span>Phase Duration: {demoPhase.durationSec}s | Elapsed: {demoElapsedTime}s</span>
              <div className="flex items-center gap-2">
                <button
                  disabled={currentPhaseIdx === 0}
                  onClick={() => {
                    setCurrentPhaseIdx((prev) => Math.max(0, prev - 1));
                    setDemoElapsedTime(0);
                  }}
                  className="px-3 py-1 bg-[#1c2028] hover:bg-[#262a33] disabled:opacity-30 rounded text-[#dfe2ee] transition-colors"
                >
                  Prev Phase
                </button>
                <button
                  disabled={currentPhaseIdx === DEMO_PHASES.length - 1}
                  onClick={() => {
                    setCurrentPhaseIdx((prev) => Math.min(DEMO_PHASES.length - 1, prev + 1));
                    setDemoElapsedTime(0);
                  }}
                  className="px-3 py-1 bg-[#10b981] hover:bg-[#005236] text-[#002113] hover:text-[#4edea3] rounded font-semibold transition-colors"
                >
                  Next Phase
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
