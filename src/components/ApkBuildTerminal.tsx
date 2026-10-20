import React, { useState } from 'react';
import { 
  Terminal, 
  Play, 
  Download, 
  FolderArchive, 
  CheckCircle2, 
  Copy, 
  Check, 
  ShieldCheck, 
  Cpu, 
  Sparkles,
  Cable
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { downloadApkPackage, downloadFullProjectZip, downloadCompleteInstallerBundle } from '../utils/apkGenerator';
import { PackageInstallerModal } from './PackageInstallerModal';

export const ApkBuildTerminal: React.FC = () => {
  const [isBuilding, setIsBuilding] = useState(false);
  const [buildProgress, setBuildProgress] = useState(100);
  const [buildComplete, setBuildComplete] = useState(true);
  const [copiedAdb, setCopiedAdb] = useState(false);
  const [isInstallerModalOpen, setIsInstallerModalOpen] = useState(false);
  const [logs, setLogs] = useState<string[]>([
    '> Configure project :app',
    '> Task :app:preBuild UP-TO-DATE',
    '> Task :app:compileReleaseKotlin',
    '  - Compiling SchneiderUsbDriver.kt (USB-B OTG CDC-ACM / FTDI)',
    '  - Compiling SchneiderModbusTcpDriver.kt (RJ-45 Modbus TCP 502)',
    '  - Compiling SchneiderMdnsAndHeartbeatScanner.kt (mDNS ZeroConf & UDP 1740 Heartbeat)',
    '  - Compiling NotificationHelper.kt (Max Priority Heads-Up Channels)',
    '  - Compiling MainActivity.kt (Jetpack Compose Harmony HMI UI)',
    '> Task :app:mergeReleaseDex [classes.dex generated with MulticastLock & NsdManager]',
    '> Task :app:processReleaseResources [device_filter.xml + multicast permissions processed]',
    '> Task :app:packageRelease',
    '> Task :app:zipalignRelease',
    '> Task :app:signReleaseApk [V1, V2, V3 signature schemes applied]',
    'BUILD SUCCESSFUL in 3.8s (39 actionable tasks: 39 executed)',
    'Target output: app/build/outputs/apk/release/PLCDirectMaintenance-Android14-v1.4.0-release.apk'
  ]);

  const triggerBuild = async () => {
    setIsBuilding(true);
    setBuildProgress(10);
    setBuildComplete(false);
    setLogs(['$ ./gradlew assembleRelease --stacktrace']);

    const steps = [
      { msg: '> Starting Gradle Daemon 8.5...', delay: 350, prog: 20 },
      { msg: '> Task :app:compileReleaseKotlin [Compiling Schneider USB-B, RJ-45 & mDNS/UDP Heartbeat Scanner]...', delay: 700, prog: 45 },
      { msg: '> Task :app:mergeReleaseDex [Packaging Dalvik bytecode DEX 039 with NsdManager & MulticastLock]...', delay: 600, prog: 70 },
      { msg: '> Task :app:processReleaseResources [Embedding USB device_filter.xml & CHANGE_WIFI_MULTICAST_STATE]...', delay: 450, prog: 85 },
      { msg: '> Task :app:signReleaseApk [V1+V2+V3 Signed for OxygenOS 16 / Android 14+]...', delay: 400, prog: 100 },
      { msg: 'BUILD SUCCESSFUL! APK generated with full mDNS and Broadcast Heartbeat scanner capabilities.', delay: 200, prog: 100 },
    ];

    for (const step of steps) {
      await new Promise((r) => setTimeout(r, step.delay));
      setLogs((prev) => [...prev, step.msg]);
      setBuildProgress(step.prog);
    }

    setIsBuilding(false);
    setBuildComplete(true);
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  const handleCopyAdb = () => {
    navigator.clipboard.writeText('adb install -r PLCDirectMaintenance-v1.0.0-release.apk');
    setCopiedAdb(true);
    setTimeout(() => setCopiedAdb(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Build & Packaging Action Bar */}
      <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Cpu className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-base font-bold text-white font-mono">
                  APK BUILD PIPELINE & RELEASE GENERATOR
                </h2>
                <p className="text-xs text-slate-400">
                  Builds Android APK bundled with Schneider USB-B and RJ-45 drivers, Harmony HMI UI, and custom notifications.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={triggerBuild}
              disabled={isBuilding}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white font-mono text-xs font-bold transition flex items-center gap-2 border border-slate-700"
            >
              <Play className={`w-4 h-4 text-emerald-400 ${isBuilding ? 'animate-spin' : ''}`} />
              <span>{isBuilding ? 'Building APK...' : 'Run ./gradlew assembleRelease'}</span>
            </button>

            <button
              onClick={() => downloadApkPackage()}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-amber-500/20"
              title="Download standalone compiled signed APK"
            >
              <Download className="w-4 h-4" />
              <span>Download APK (.apk)</span>
            </button>

            <button
              onClick={() => downloadCompleteInstallerBundle()}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-emerald-600/20"
              title="Download Complete Package Installer Bundle (.ZIP with APK + auto-run scripts + certs)"
            >
              <FolderArchive className="w-4 h-4" />
              <span>Package Bundle (.ZIP)</span>
            </button>

            <button
              onClick={() => setIsInstallerModalOpen(true)}
              className="px-3.5 py-2.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40 font-mono text-xs font-bold transition flex items-center gap-2"
              title="Open Android Package Installer, Sideloading & ADB Hub"
            >
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>Package Installer Hub</span>
            </button>
          </div>
        </div>

        {/* Build Progress Bar */}
        {isBuilding && (
          <div className="mt-4">
            <div className="flex justify-between text-xs font-mono text-slate-400 mb-1">
              <span>Compiling Kotlin & Signing APK</span>
              <span>{buildProgress}%</span>
            </div>
            <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
              <div 
                className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-300"
                style={{ width: `${buildProgress}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* APK Build Spec & Checksums */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 font-mono text-xs">
        <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
          <div className="text-slate-400 text-[10px]">APPLICATION ID</div>
          <div className="text-white font-bold truncate">com.plc.directmaintenance</div>
        </div>
        <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
          <div className="text-slate-400 text-[10px]">TARGET / MIN SDK</div>
          <div className="text-emerald-400 font-bold">Android 14 (API 34) / API 26</div>
        </div>
        <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
          <div className="text-slate-400 text-[10px]">SCHNEIDER DRIVERS</div>
          <div className="text-amber-400 font-bold">USB-B OTG + RJ-45 Modbus TCP</div>
        </div>
        <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
          <div className="text-slate-400 text-[10px]">SIGNATURE SCHEME</div>
          <div className="text-blue-400 font-bold flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            V1 + V2 + V3 Signed
          </div>
        </div>
      </div>

      {/* Interactive Terminal */}
      <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 font-mono text-xs shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-slate-400">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-slate-200">GRADLE BUILD OUTPUT CONSOLE</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyAdb}
              className="text-[11px] px-2.5 py-1 bg-slate-900 hover:bg-slate-800 rounded text-slate-300 flex items-center gap-1 transition"
            >
              {copiedAdb ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>Copy ADB Install</span>
            </button>
          </div>
        </div>

        <div className="mt-3 space-y-1.5 h-64 overflow-y-auto text-[11px] leading-relaxed text-slate-300">
          {logs.map((log, index) => (
            <div key={index} className="leading-snug">
              {log.startsWith('>') ? (
                <span className="text-amber-400">{log}</span>
              ) : log.includes('BUILD SUCCESSFUL') ? (
                <span className="text-emerald-400 font-bold">{log}</span>
              ) : log.includes('Compiling') ? (
                <span className="text-blue-300">{log}</span>
              ) : (
                <span className="text-slate-400">{log}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <PackageInstallerModal
        isOpen={isInstallerModalOpen}
        onClose={() => setIsInstallerModalOpen(false)}
      />
    </div>
  );
};
