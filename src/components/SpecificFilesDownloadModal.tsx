import React, { useState } from 'react';
import { 
  Download, 
  FolderTree, 
  FileCode, 
  Copy, 
  Check, 
  Search, 
  ExternalLink, 
  X, 
  FileText, 
  Cpu, 
  Package, 
  ArrowDownToLine, 
  Layers, 
  Terminal, 
  ShieldCheck, 
  Sparkles,
  Info
} from 'lucide-react';
import { KOTLIN_CODEBASE, CodeFile } from '../data/codebaseFiles';
import { 
  downloadApkPackage, 
  downloadFullProjectZip, 
  downloadCompleteInstallerBundle 
} from '../utils/apkGenerator';

interface SpecificFilesDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSelectedPath?: string;
}

export const SpecificFilesDownloadModal: React.FC<SpecificFilesDownloadModalProps> = ({
  isOpen,
  onClose,
  initialSelectedPath
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedFile, setSelectedFile] = useState<CodeFile>(
    KOTLIN_CODEBASE.find((f) => f.path === initialSelectedPath) ||
    KOTLIN_CODEBASE.find((f) => f.path.includes('CumminsMarineEngineProfile.kt')) ||
    KOTLIN_CODEBASE[0]
  );
  const [copied, setCopied] = useState(false);
  const [isDownloadingBundle, setIsDownloadingBundle] = useState(false);
  const [isDownloadingApk, setIsDownloadingApk] = useState(false);

  if (!isOpen) return null;

  const categories = [
    { id: 'all', label: 'All Files' },
    { id: 'cummins', label: 'Cummins & DG (New)', badge: 'New' },
    { id: 'driver', label: 'Hardware Drivers' },
    { id: 'model', label: 'Data Models' },
    { id: 'ui', label: 'Jetpack UI' },
    { id: 'service', label: 'Background Services' },
    { id: 'config', label: 'Configs & XML' }
  ];

  const filteredFiles = KOTLIN_CODEBASE.filter((file) => {
    const matchesSearch =
      file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.description.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'cummins') {
      return (
        file.name.includes('Cummins') || 
        file.name.includes('Tm241') || 
        file.path.includes('cummins')
      );
    }
    return file.category === selectedCategory;
  });

  const handleCopyCode = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSingleFile = (file: CodeFile) => {
    const blob = new Blob([file.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleDownloadApk = async () => {
    setIsDownloadingApk(true);
    try {
      await downloadApkPackage('android-14');
    } finally {
      setIsDownloadingApk(false);
    }
  };

  const handleDownloadInstallerBundle = async () => {
    setIsDownloadingBundle(true);
    try {
      await downloadCompleteInstallerBundle();
    } finally {
      setIsDownloadingBundle(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-6xl h-[92vh] max-h-[920px] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
              <FolderTree className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold font-mono text-white tracking-wide">
                  SPECIFIC FILES TO DOWNLOAD WITH LOCATION INFO
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-bold">
                  {KOTLIN_CODEBASE.length} Files Ready
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Download individual source files or complete APK packages with their exact target project paths.
              </p>
            </div>
          </div>

          {/* Quick Actions & Close */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadApk}
              disabled={isDownloadingApk}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
              title="Download compiled signed APK"
            >
              <Package className="w-3.5 h-3.5" />
              <span>{isDownloadingApk ? 'Generating...' : 'Download APK (.apk)'}</span>
            </button>

            <button
              onClick={handleDownloadInstallerBundle}
              disabled={isDownloadingBundle}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-amber-500/20"
              title="Download APK + Source Code + 1-Click ADB Installer Bundle"
            >
              <ArrowDownToLine className="w-3.5 h-3.5" />
              <span>{isDownloadingBundle ? 'Packaging...' : 'Download Full Bundle (.zip)'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Category Tabs & Search Bar */}
        <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto py-1">
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-medium transition flex items-center gap-1.5 shrink-0 ${
                  selectedCategory === c.id
                    ? 'bg-amber-500/20 border border-amber-500/60 text-amber-300'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <span>{c.label}</span>
                {c.badge && (
                  <span className="px-1.5 py-0.2 rounded bg-amber-400 text-slate-950 text-[9px] font-bold">
                    {c.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Filter by name, path..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 font-mono focus:border-amber-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Main Content Split: File Tree List (Left) + File Viewer & Location Card (Right) */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {/* File Directory List */}
          <div className="w-full md:w-80 lg:w-96 bg-slate-950/70 border-r border-slate-800 flex flex-col shrink-0 overflow-y-auto p-3 space-y-2">
            <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider px-1">
              File Tree & Exact Paths ({filteredFiles.length})
            </div>

            {filteredFiles.map((file) => {
              const isSelected = selectedFile.path === file.path;
              const isNewCummins = file.name.includes('Cummins') || file.name.includes('Tm241') || file.path.includes('cummins');

              return (
                <div
                  key={file.path}
                  onClick={() => setSelectedFile(file)}
                  className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-amber-950/40 border-amber-500/70 shadow-md ring-1 ring-amber-500/30'
                      : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-900 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-mono text-xs font-bold text-white flex items-center gap-1.5 truncate">
                      <FileCode className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-amber-400' : 'text-slate-400'}`} />
                      <span className="truncate">{file.name}</span>
                    </span>
                    {isNewCummins && (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[9px] font-mono font-bold shrink-0">
                        DG / Engine
                      </span>
                    )}
                  </div>

                  <div className="font-mono text-[10px] text-slate-400 truncate mb-1" title={file.path}>
                    📂 {file.path}
                  </div>

                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                    {file.description}
                  </p>

                  <div className="mt-2 pt-1.5 border-t border-slate-800/60 flex items-center justify-between text-[10px] font-mono">
                    <span className="text-slate-400 uppercase">{file.language}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadSingleFile(file);
                      }}
                      className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 transition"
                    >
                      <Download className="w-3 h-3" />
                      <span>Download</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Detailed Inspector & Code Display */}
          <div className="flex-1 flex flex-col bg-slate-900 overflow-hidden">
            
            {/* File Metadata Location Card */}
            <div className="p-4 bg-slate-950/90 border-b border-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm sm:text-base font-bold font-mono text-white flex items-center gap-2">
                      <FileText className="w-4 h-4 text-amber-400" />
                      <span>{selectedFile.name}</span>
                    </h3>
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-mono">
                      Category: {selectedFile.category.toUpperCase()}
                    </span>
                  </div>

                  {/* EXACT LOCATION PATH TAG */}
                  <div className="mt-2 flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 font-mono text-xs">
                    <span className="text-amber-400 font-bold">Target Location:</span>
                    <span className="text-emerald-300 font-bold select-all">{selectedFile.path}</span>
                  </div>
                </div>

                {/* Download and Copy Actions */}
                <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                  <button
                    onClick={handleCopyCode}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-bold flex items-center gap-1.5 transition"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied!' : 'Copy Code'}</span>
                  </button>

                  <button
                    onClick={() => handleDownloadSingleFile(selectedFile)}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold flex items-center gap-1.5 transition shadow-lg shadow-emerald-600/20"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download File</span>
                  </button>
                </div>
              </div>

              <p className="text-xs text-slate-300 mt-2.5">
                {selectedFile.description}
              </p>
            </div>

            {/* Code Content Container */}
            <div className="flex-1 overflow-auto p-4 bg-slate-950 font-mono text-xs text-slate-200 leading-relaxed select-text">
              <pre className="whitespace-pre font-mono">
                <code>{selectedFile.content}</code>
              </pre>
            </div>

            {/* Bottom Bar: Instructions on where to put this file */}
            <div className="p-3 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
              <div className="text-slate-400 flex items-center gap-2">
                <Info className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  Place this file at <strong className="text-white">{selectedFile.path}</strong> inside your Android project root.
                </span>
              </div>
              <button
                onClick={() => downloadFullProjectZip()}
                className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1.5 transition"
              >
                <FolderTree className="w-3.5 h-3.5" />
                <span>Download Entire Project ZIP</span>
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
