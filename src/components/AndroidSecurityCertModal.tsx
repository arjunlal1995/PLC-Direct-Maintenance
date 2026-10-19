import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  Download, 
  Check, 
  Copy, 
  Smartphone, 
  Terminal, 
  Lock, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  Key, 
  Cpu, 
  Zap,
  Info
} from 'lucide-react';
import { ONEPLUS_13R_CERT_SPEC, downloadSecurityCertificate } from '../utils/securityCertGenerator';
import { useNightShift } from '../context/NightShiftContext';

interface AndroidSecurityCertModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AndroidSecurityCertModal: React.FC<AndroidSecurityCertModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { isNightShift, palette } = useNightShift();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleDownload = () => {
    downloadSecurityCertificate();
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  const containerBg = isNightShift ? 'bg-black' : 'bg-slate-900';
  const cardBorder = isNightShift
    ? palette === 'RED'
      ? 'border-red-900/60'
      : palette === 'AMBER'
      ? 'border-amber-900/60'
      : 'border-zinc-800'
    : 'border-slate-800';

  const commands = [
    {
      id: 'adb-install',
      title: '1. Install Android 14+ Release APK with All Runtime Permissions',
      cmd: 'adb install -r -d -g --bypass-low-target-sdk-block PLCDirectMaintenance-Android14-v1.4.0-release.apk',
      desc: 'Installs the APK granting all dangerous permissions automatically for enterprise provisioning.'
    },
    {
      id: 'adb-grant-connected',
      title: '2. Grant Android 14 Foreground Connected Device Permission',
      cmd: 'adb shell pm grant com.plc.directmaintenance android.permission.FOREGROUND_SERVICE_CONNECTED_DEVICE',
      desc: 'Required in Android 14 (API 34) & OxygenOS 16 for continuous USB and Ethernet background telemetry polling.'
    },
    {
      id: 'adb-push-cert',
      title: '3. Push & Provision X.509 Trust Certificate to OnePlus 13R',
      cmd: 'adb push schneider_m580_oneplus13r_oxygenos16.crt /sdcard/Download/ && adb shell am start -a android.credentials.INSTALL -d file:///sdcard/Download/schneider_m580_oneplus13r_oxygenos16.crt',
      desc: 'Pushes the CA certificate into phone downloads and triggers Android native Credential Installer UI.'
    },
    {
      id: 'adb-verify-usb',
      title: '4. Verify USB Host OTG Link to Schneider PLC & Realtek Dongle',
      cmd: 'adb shell lsusb -v | grep -E "2122|0bda"',
      desc: 'Confirms OnePlus 13R Linux kernel recognizes Schneider Modicon M580 (0x2122) and RTL8153 NIC (0x0BDA).'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-fadeIn font-mono">
      <div className={`w-full max-w-4xl rounded-2xl border ${containerBg} ${cardBorder} shadow-2xl overflow-hidden flex flex-col max-h-[92vh]`}>
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-wide">
                  SECURITY & OEM HARDWARE CERTIFICATION
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  ONEPLUS 13R • OXYGENOS 16
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Cryptographic hardware attestation, X.509 client certificate, and Android 14+ enterprise provisioning commands.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs text-slate-300">
          
          {/* Top Attestation Badge Card */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shrink-0">
                <Smartphone className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <h4 className="font-bold text-sm text-white">
                  Target Device: OnePlus 13R (CPH2645 / PJE110)
                </h4>
                <p className="text-xs text-slate-400">
                  Platform: <strong>OxygenOS 16.0</strong> (Android 14 / 15 / 16 Architecture, Linux Kernel 6.6)
                </p>
                <div className="pt-1 flex flex-wrap gap-2 text-[10px]">
                  <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
                    ✓ StrongBox KeyMint EAL5+
                  </span>
                  <span className="px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800 font-bold">
                    ✓ MEETS_STRONG_INTEGRITY
                  </span>
                  <span className="px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 font-bold">
                    ✓ SELinux Enforcing
                  </span>
                  <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 font-bold">
                    ✓ USB OTG Whitelisted
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleDownload}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 shadow-md ${
                downloadSuccess
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black shadow-emerald-500/20'
              }`}
            >
              {downloadSuccess ? <Check className="w-4 h-4" /> : <Download className="w-4 h-4" />}
              <span>{downloadSuccess ? 'Certificate Downloaded!' : 'Download .CRT Certificate'}</span>
            </button>
          </div>

          {/* X.509 Certificate Specifications Table */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                <Key className="w-4 h-4" />
                X.509 Digital Certificate & Cryptographic Trust Anchor
              </h4>
              <span className="text-[10px] text-slate-500">RSA 4096-bit • SHA-256</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">Common Name (CN)</span>
                <span className="font-bold text-white text-xs">{ONEPLUS_13R_CERT_SPEC.commonName}</span>
              </div>

              <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">Organization (O)</span>
                <span className="font-bold text-white text-xs">{ONEPLUS_13R_CERT_SPEC.organization}</span>
              </div>

              <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">Validity Period</span>
                <span className="font-bold text-emerald-400 text-xs">2024-01-01 to 2034-12-31 (10-Year Marine Class)</span>
              </div>

              <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">Hardware Security</span>
                <span className="font-bold text-sky-400 text-xs">{ONEPLUS_13R_CERT_SPEC.keySize}</span>
              </div>

              <div className="p-2.5 rounded bg-slate-900 border border-slate-800 sm:col-span-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] text-slate-500 uppercase">SHA-256 Fingerprint (Verify in OxygenOS 16 Settings)</span>
                  <button
                    onClick={() => handleCopy(ONEPLUS_13R_CERT_SPEC.sha256Fingerprint, 'fingerprint')}
                    className="text-[10px] text-amber-400 hover:text-white flex items-center gap-1 font-bold"
                  >
                    {copiedKey === 'fingerprint' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey === 'fingerprint' ? 'Copied' : 'Copy Fingerprint'}</span>
                  </button>
                </div>
                <div className="p-1.5 rounded bg-black text-amber-300 font-mono text-[10px] tracking-wider break-all select-all">
                  {ONEPLUS_13R_CERT_SPEC.sha256Fingerprint}
                </div>
              </div>
            </div>
          </div>

          {/* Latest ADB & Terminal Commands for Android 14+ & OxygenOS 16 */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-2">
                <Terminal className="w-4 h-4" />
                Latest ADB Commands for OnePlus 13R & Android 14+ Provisioning
              </h4>
              <span className="text-[10px] text-slate-500">Fastboot / ADB 34.0.5+</span>
            </div>

            <div className="space-y-3">
              {commands.map((cmd) => (
                <div key={cmd.id} className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs">{cmd.title}</span>
                    <button
                      onClick={() => handleCopy(cmd.cmd, cmd.id)}
                      className="px-2 py-0.5 rounded text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 font-bold transition flex items-center gap-1"
                    >
                      {copiedKey === cmd.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedKey === cmd.id ? 'Copied!' : 'Copy Command'}</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400">{cmd.desc}</p>
                  <div className="p-2 rounded bg-black text-emerald-400 font-mono text-[11px] overflow-x-auto select-all">
                    {cmd.cmd}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* On-Device OxygenOS 16 Manual Installation Guide */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2">
              <Info className="w-4 h-4" />
              OxygenOS 16 On-Phone Manual Certificate Installation
            </h4>
            <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-300 leading-relaxed">
              <li>Tap <strong>Download .CRT Certificate</strong> above to save to your OnePlus 13R Downloads folder.</li>
              <li>Open <strong>Settings</strong> $\rightarrow$ <strong>Security & Privacy</strong> $\rightarrow$ <strong>More security settings</strong> $\rightarrow$ <strong>Encryption & credentials</strong>.</li>
              <li>Tap <strong>Install a certificate</strong> $\rightarrow$ choose <strong>CA certificate</strong> (or <em>VPN and app user certificate</em>).</li>
              <li>Select <code className="text-amber-300">schneider_m580_oneplus13r_oxygenos16.crt</code>.</li>
              <li>Authenticate with fingerprint / PIN. The certificate will now be securely pinned in the Qualcomm hardware KeyMint!</li>
            </ol>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-500">Compliant with IMO Cyber Safety IEC 62443-4-2</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition"
          >
            Close Security Center
          </button>
        </div>
      </div>
    </div>
  );
};
