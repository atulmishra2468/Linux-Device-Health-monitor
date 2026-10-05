import React, { useState } from 'react';
import { X, Copy, Download, Check, FileCode, CheckCircle2 } from 'lucide-react';
import { SOURCE_CODE_FILES, SourceFile } from '../data/sourceCodeFiles';

interface SourceCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialFileId?: string;
  onShowToast: (msg: string) => void;
}

export const SourceCodeModal: React.FC<SourceCodeModalProps> = ({
  isOpen,
  onClose,
  initialFileId,
  onShowToast,
}) => {
  const [selectedFileId, setSelectedFileId] = useState<string>(initialFileId || 'sysmonitor_c');
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentFile = SOURCE_CODE_FILES.find((f) => f.id === selectedFileId) || SOURCE_CODE_FILES[0];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentFile.content);
    setCopied(true);
    onShowToast(`Copied ${currentFile.name} to clipboard`);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([currentFile.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = currentFile.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onShowToast(`Downloaded ${currentFile.name}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#0a0e16]/85 backdrop-blur-md">
      <div className="bg-[#181c24] border border-[#262a33] max-w-5xl w-full h-[85vh] rounded-xl shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Top Bar */}
        <div className="px-6 py-4 border-b border-[#262a33] flex items-center justify-between bg-[#1c2028]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-[#4edea3]/10 flex items-center justify-center text-[#4edea3]">
              <FileCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-base text-[#dfe2ee] flex items-center gap-2">
                <span>Kernel Driver &amp; Daemon Source Code Inspector</span>
                <span className="text-xs font-mono text-[#4cd7f6] bg-[#004e5c]/40 px-2 py-0.5 rounded">
                  GPL-2.0 / MIT
                </span>
              </h3>
              <p className="text-xs text-[#bbcabf] font-mono mt-0.5">
                {currentFile.path} ({Math.round(currentFile.sizeBytes / 1024)} KB)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#262a33] hover:bg-[#31353e] text-[#dfe2ee] rounded text-xs font-mono transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#4edea3]" /> : <Copy className="w-3.5 h-3.5 text-[#4cd7f6]" />}
              <span>{copied ? 'Copied!' : 'Copy Code'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#10b981] hover:bg-[#005236] text-[#002113] hover:text-[#4edea3] rounded text-xs font-mono font-semibold transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download File</span>
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 ml-2 rounded-lg bg-[#262a33] hover:bg-[#31353e] flex items-center justify-center text-[#dfe2ee] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body: Sidebar Tabs + Code Viewer */}
        <div className="flex-1 flex overflow-hidden">
          {/* File selector sidebar */}
          <div className="w-64 bg-[#111827] border-r border-[#262a33] p-3 flex flex-col gap-1 overflow-y-auto">
            <div className="font-mono text-[10px] uppercase tracking-wider text-[#86948a] px-2 py-1">
              Project Artifacts
            </div>
            {SOURCE_CODE_FILES.map((file) => {
              const isSelected = file.id === selectedFileId;
              return (
                <button
                  key={file.id}
                  onClick={() => setSelectedFileId(file.id)}
                  className={`flex flex-col items-start px-3 py-2 rounded-lg text-left transition-colors font-mono text-xs ${
                    isSelected
                      ? 'bg-[#1c2028] text-[#4edea3] border border-[#4edea3]/40'
                      : 'text-[#bbcabf] hover:bg-[#181c24] hover:text-[#dfe2ee]'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-semibold text-xs">{file.name}</span>
                    <span className="text-[10px] text-[#86948a] uppercase">{file.language}</span>
                  </div>
                  <span className="text-[11px] text-[#86948a] truncate w-full mt-0.5">
                    {file.path}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Code Viewer Panel */}
          <div className="flex-1 flex flex-col bg-[#0a0e16] overflow-hidden">
            <div className="px-4 py-2 bg-[#141923] border-b border-[#262a33] flex items-center justify-between text-xs font-mono text-[#bbcabf]">
              <span className="truncate">{currentFile.description}</span>
              <span className="text-[#4cd7f6] shrink-0">UTF-8 Unix (LF)</span>
            </div>
            <pre className="flex-1 p-4 font-mono text-xs text-[#dfe2ee] leading-relaxed overflow-y-auto overflow-x-auto select-text terminal-scroll bg-[#0a0e16]">
              <code>{currentFile.content}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
