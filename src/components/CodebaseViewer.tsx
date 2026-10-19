import React, { useState } from 'react';
import { 
  FileCode, 
  Copy, 
  Check, 
  Download, 
  Search, 
  FolderTree, 
  Layers, 
  Cable, 
  Cpu, 
  FileText 
} from 'lucide-react';
import { KOTLIN_CODEBASE, CodeFile } from '../data/codebaseFiles';

export const CodebaseViewer: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<CodeFile>(
    KOTLIN_CODEBASE.find((f) => f.path.includes('SchneiderUsbDriver.kt')) || KOTLIN_CODEBASE[0]
  );
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFiles = KOTLIN_CODEBASE.filter((file) =>
    file.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
    file.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadFile = () => {
    const blob = new Blob([selectedFile.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = selectedFile.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl flex flex-col h-[750px]">
      {/* Top Header */}
      <div className="p-4 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FolderTree className="w-5 h-5 text-amber-400" />
          <div>
            <h2 className="text-sm font-bold text-white font-mono">
              ANDROID KOTLIN CODEBASE & SCHNEIDER DRIVERS
            </h2>
            <p className="text-xs text-slate-400">
              Complete production source code ready for compilation into an Android APK.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono flex items-center gap-1.5 transition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy File'}</span>
          </button>
          <button
            onClick={handleDownloadFile}
            className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-mono font-bold flex items-center gap-1.5 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </button>
        </div>
      </div>

      {/* Main split container: Sidebar + Code display */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left File Tree Sidebar */}
        <div className="w-full md:w-80 bg-slate-950/80 border-r border-slate-800 flex flex-col shrink-0">
          <div className="p-3 border-b border-slate-800">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 font-mono"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filteredFiles.map((file) => {
              const isSelected = selectedFile.path === file.path;
              return (
                <button
                  key={file.path}
                  onClick={() => setSelectedFile(file)}
                  className={`w-full text-left p-2 rounded-xl transition flex items-start gap-2 text-xs font-mono ${
                    isSelected
                      ? 'bg-amber-500/10 border border-amber-500/40 text-amber-300'
                      : 'hover:bg-slate-900 text-slate-300'
                  }`}
                >
                  <span className="mt-0.5">
                    {file.category === 'driver' ? (
                      <Cable className="w-3.5 h-3.5 text-emerald-400" />
                    ) : file.category === 'manifest' ? (
                      <Layers className="w-3.5 h-3.5 text-blue-400" />
                    ) : file.category === 'kotlin' ? (
                      <FileCode className="w-3.5 h-3.5 text-amber-400" />
                    ) : (
                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                    )}
                  </span>
                  <div className="truncate">
                    <div className="font-semibold truncate">{file.name}</div>
                    <div className="text-[10px] text-slate-500 truncate">{file.path}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Code Area */}
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-950">
          {/* File description banner */}
          <div className="p-3 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between text-xs font-mono">
            <div>
              <span className="text-white font-bold">{selectedFile.path}</span>
              <span className="text-slate-400 ml-2 hidden sm:inline">({selectedFile.description})</span>
            </div>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-amber-400 uppercase text-[10px] font-bold">
              {selectedFile.language}
            </span>
          </div>

          {/* Scrollable Code block with line numbers */}
          <div className="flex-1 overflow-auto p-4 font-mono text-xs text-slate-200 leading-relaxed bg-[#0b0f19]">
            <pre className="table">
              {selectedFile.content.split('\n').map((line, idx) => (
                <div key={idx} className="table-row hover:bg-slate-800/40">
                  <span className="table-cell select-none text-slate-600 text-right pr-4 w-10 text-[11px]">
                    {idx + 1}
                  </span>
                  <span className="table-cell whitespace-pre">
                    {line}
                  </span>
                </div>
              ))}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
