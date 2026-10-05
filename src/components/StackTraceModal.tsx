import React from 'react';
import { Terminal, X, CheckCircle, ShieldCheck } from 'lucide-react';

interface StackTraceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StackTraceModal: React.FC<StackTraceModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#0a0e16]/80 backdrop-blur-md">
      <div className="bg-[#181c24] border border-[#262a33] max-w-3xl w-full rounded-xl p-6 shadow-2xl flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-[#4cd7f6]/10 flex items-center justify-center text-[#4cd7f6]">
              <Terminal className="w-4 h-4 text-[#4cd7f6]" />
            </div>
            <h3 className="font-semibold text-lg text-[#dfe2ee]">
              Kernel Call Stack Verification Inspector
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#1c2028] hover:bg-[#262a33] flex items-center justify-center text-[#dfe2ee] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Description */}
        <p className="text-sm text-[#bbcabf] leading-relaxed">
          Inspection showing a verified non-faulting call trace of{' '}
          <code className="text-[#4edea3] font-mono text-xs bg-[#0f131c] px-1.5 py-0.5 rounded border border-[#262a33]">
            sysmonitor.ko
          </code>{' '}
          handling an IOCTL dispatch via the Virtual File System (VFS). Frame pointers and RIP registers are completely intact.
        </p>

        {/* Terminal Trace Box */}
        <div className="bg-[#0a0e16] border border-[#1c2028] p-4 rounded-lg font-mono text-xs overflow-x-auto space-y-1 text-[#dfe2ee]">
          <div className="text-[#86948a]">[ 143.012888 ] Call Trace:</div>
          <div className="text-[#86948a]">&lt;TASK&gt;</div>
          <div className="pl-4">
            <span className="text-[#4cd7f6]">dump_stack_lvl</span>+0x44/0x5c
          </div>
          <div className="pl-4">
            <span className="text-[#4edea3]">sysmonitor_ioctl</span>+0x8a/0x120 [sysmonitor]
          </div>
          <div className="pl-4">__x64_sys_ioctl+0x91/0xd0</div>
          <div className="pl-4">do_syscall_64+0x58/0xc0</div>
          <div className="pl-4">entry_SYSCALL_64_after_hwframe+0x72/0xdc</div>
          <div className="text-[#86948a] pt-1">
            RIP: 0033:0x7f83a21b3a0b
          </div>
          <div className="text-[#86948a]">
            RSP: 002b:00007ffc8ef92bf8 EFLAGS: 00000246 ORIG_RAX: 0000000000000010
          </div>
          <div className="text-[#86948a]">
            RAX: ffffffffffffffda RBX: 0000000000000000 RCX: 00007f83a21b3a0b
          </div>
          <div className="text-[#86948a]">&lt;/TASK&gt;</div>
          <div className="text-[#4edea3] pt-2 font-semibold flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>--- [ Status: 0 Kernel Panic, RIP Valid, Return 0 (Success) ] ---</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2 text-xs font-mono text-[#86948a]">
            <ShieldCheck className="w-4 h-4 text-[#4edea3]" />
            <span>Verified with: ORC unwinder (x86_64)</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#10b981] hover:bg-[#005236] text-[#002113] hover:text-[#4edea3] font-mono text-xs font-semibold rounded transition-colors"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
