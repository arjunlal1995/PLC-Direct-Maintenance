import React, { useState } from 'react';
import { 
  CheckSquare, 
  Square, 
  CheckCircle2, 
  AlertOctagon, 
  AlertTriangle, 
  Clock, 
  Wrench, 
  ShieldAlert, 
  User, 
  Printer, 
  Plus, 
  X, 
  FileCheck, 
  Sparkles,
  Layers,
  ChevronDown,
  ChevronUp,
  Tag
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { PlcAlert, MaintenanceChecklist, ChecklistItem } from '../types';
import { generateChecklistForAlert } from '../data/maintenanceProcedures';
import { audioAlerts } from '../utils/audioAlerts';

interface MaintenanceChecklistModalProps {
  alert: PlcAlert | null;
  isOpen: boolean;
  onClose: () => void;
  onResolveAlert: (alertId: string, notes: string) => void;
}

export const MaintenanceChecklistModal: React.FC<MaintenanceChecklistModalProps> = ({
  alert,
  isOpen,
  onClose,
  onResolveAlert,
}) => {
  if (!isOpen || !alert) return null;

  // Initialize or maintain checklist state for this alert
  const [checklist, setChecklist] = useState<MaintenanceChecklist>(() =>
    generateChecklistForAlert(alert)
  );
  const [technicianNotes, setTechnicianNotes] = useState('');
  const [newStepText, setNewStepText] = useState('');
  const [showAddStep, setShowAddStep] = useState(false);
  const [expandedStepId, setExpandedStepId] = useState<string | null>(checklist.items[0]?.id || null);

  const completedCount = checklist.items.filter((item) => item.isCompleted).length;
  const totalCount = checklist.items.length;
  const progressPercent = Math.round((completedCount / totalCount) * 100);
  const allCriticalDone = checklist.items
    .filter((item) => item.criticalStep)
    .every((item) => item.isCompleted);

  const toggleItem = (itemId: string) => {
    setChecklist((prev) => ({
      ...prev,
      items: prev.items.map((item) => {
        if (item.id === itemId) {
          const nextCompleted = !item.isCompleted;
          if (nextCompleted) audioAlerts.playAckBlip();
          return {
            ...item,
            isCompleted: nextCompleted,
            completedAt: nextCompleted ? Date.now() : undefined,
            completedBy: nextCompleted ? checklist.assignedTechnician : undefined,
          };
        }
        return item;
      }),
    }));
  };

  const handleAddStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStepText.trim()) return;

    const newItem: ChecklistItem = {
      id: `custom-step-${Date.now()}`,
      title: newStepText.trim(),
      description: 'Custom field inspection step logged by on-shift technician.',
      isCompleted: false,
      criticalStep: false,
      estimatedMinutes: 5,
    };

    setChecklist((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
    }));
    setNewStepText('');
    setShowAddStep(false);
  };

  const handleCompleteWorkOrder = () => {
    onResolveAlert(alert.id, technicianNotes);
    confetti({
      particleCount: 100,
      spread: 80,
      origin: { y: 0.5 },
    });
    audioAlerts.playAckBlip();
    onClose();
  };

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden font-sans">
        
        {/* Modal Top Header */}
        <div className="p-4 sm:p-5 bg-slate-950 border-b border-slate-800 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className={`p-2.5 rounded-2xl ${
              alert.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            }`}>
              {alert.severity === 'CRITICAL' ? <AlertOctagon className="w-6 h-6 animate-pulse" /> : <AlertTriangle className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {checklist.procedureCode}
                </span>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                  alert.severity === 'CRITICAL' ? 'bg-red-500 text-white' : 'bg-amber-500 text-slate-950'
                }`}>
                  {alert.severity} FAULT
                </span>
                <span className="text-xs font-mono text-emerald-400 font-bold">
                  Target Tag: {alert.plcTag}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white mt-1 leading-snug">
                {checklist.title}
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Machine: {alert.machineName} ({alert.location}) • Triggered: {alert.title}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress & Technician Assignment Strip */}
        <div className="px-5 py-3 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between text-xs font-mono gap-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-slate-300">
              <User className="w-3.5 h-3.5 text-amber-400" />
              <span>Assigned: <strong className="text-white">{checklist.assignedTechnician}</strong></span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 text-slate-300">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              <span>Est. Total Time: <strong>~45 mins</strong></span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="flex items-center gap-3">
            <span className="text-slate-400">
              Progress: <strong className="text-emerald-400">{completedCount} / {totalCount}</strong> ({progressPercent}%)
            </span>
            <div className="w-28 h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
              <div 
                className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Safety & PPE Notice Banner */}
          <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-200 leading-relaxed">
              <strong className="text-amber-300">MANDATORY INDUSTRIAL SAFETY PROTOCOL:</strong> Verify Lockout / Tagout (LOTO) on pump breaker and 400V inverter drive disconnect. Eye protection and steel-toe footwear required at all times.
            </div>
          </div>

          {/* Checklist Items List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono font-bold text-slate-300 tracking-wider uppercase flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-emerald-400" />
                PROCEDURAL MAINTENANCE CHECKLIST
              </h3>
              <button
                onClick={() => setShowAddStep(!showAddStep)}
                className="text-xs font-mono text-amber-400 hover:text-amber-300 flex items-center gap-1 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Inspection Step
              </button>
            </div>

            {/* Quick Add Step Input */}
            {showAddStep && (
              <form onSubmit={handleAddStep} className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Inspect rubber hose coupling for weeping oil..."
                  value={newStepText}
                  onChange={(e) => setNewStepText(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 font-mono"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-mono font-bold transition"
                >
                  Add
                </button>
              </form>
            )}

            <div className="space-y-2.5">
              {checklist.items.map((item, index) => {
                const isExpanded = expandedStepId === item.id;
                return (
                  <div
                    key={item.id}
                    className={`rounded-2xl border transition-all ${
                      item.isCompleted
                        ? 'bg-emerald-950/20 border-emerald-500/40'
                        : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="p-3.5 flex items-start gap-3">
                      {/* Checkbox Button */}
                      <button
                        onClick={() => toggleItem(item.id)}
                        className={`p-1 rounded-lg transition shrink-0 mt-0.5 ${
                          item.isCompleted
                            ? 'text-emerald-400 hover:text-emerald-300'
                            : 'text-slate-500 hover:text-amber-400'
                        }`}
                      >
                        {item.isCompleted ? (
                          <CheckSquare className="w-5 h-5 fill-emerald-500/20" />
                        ) : (
                          <Square className="w-5 h-5" />
                        )}
                      </button>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                            STEP {index + 1}
                          </span>
                          {item.criticalStep && (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 font-bold border border-red-500/40">
                              CRITICAL SAFETY
                            </span>
                          )}
                          {item.estimatedMinutes && (
                            <span className="text-[10px] font-mono text-slate-400">
                              ⏱ {item.estimatedMinutes}m
                            </span>
                          )}
                        </div>

                        <div 
                          onClick={() => setExpandedStepId(isExpanded ? null : item.id)}
                          className="cursor-pointer mt-1"
                        >
                          <div className={`text-sm font-semibold transition ${
                            item.isCompleted ? 'text-slate-400 line-through' : 'text-slate-100'
                          }`}>
                            {item.title}
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                            {item.description}
                          </p>
                        </div>

                        {/* Expanded details (PPE, Tools, Completed timestamp) */}
                        {isExpanded && (
                          <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-2 text-xs font-mono">
                            <p className="text-slate-300 font-sans leading-relaxed">
                              {item.description}
                            </p>

                            {item.ppeRequired && item.ppeRequired.length > 0 && (
                              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                <span className="text-[10px] text-slate-500">PPE:</span>
                                {item.ppeRequired.map((ppe, i) => (
                                  <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-amber-300">
                                    {ppe}
                                  </span>
                                ))}
                              </div>
                            )}

                            {item.toolsRequired && item.toolsRequired.length > 0 && (
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="text-[10px] text-slate-500">TOOLS:</span>
                                {item.toolsRequired.map((tool, i) => (
                                  <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-blue-300">
                                    {tool}
                                  </span>
                                ))}
                              </div>
                            )}

                            {item.isCompleted && item.completedAt && (
                              <div className="text-[10px] text-emerald-400 pt-1">
                                ✓ Completed at {new Date(item.completedAt).toLocaleTimeString()} by {item.completedBy}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => setExpandedStepId(isExpanded ? null : item.id)}
                        className="text-slate-500 hover:text-slate-300 p-1"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Parts Used Section */}
          {checklist.partsUsed && checklist.partsUsed.length > 0 && (
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
              <h4 className="text-xs font-mono font-bold text-slate-300 uppercase flex items-center gap-2">
                <Wrench className="w-4 h-4 text-amber-400" />
                AUTHORIZED REPLACEMENT PARTS FOR THIS PROCEDURE
              </h4>
              <div className="space-y-1.5 font-mono text-xs">
                {checklist.partsUsed.map((p, idx) => (
                  <div key={idx} className="flex justify-between p-2 bg-slate-900 rounded-lg text-slate-300">
                    <div>
                      <span className="text-amber-400 font-bold">{p.partNumber}</span>
                      <span className="text-slate-400 ml-2">{p.name}</span>
                    </div>
                    <span className="text-emerald-400">Qty: {p.quantity}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Technician Field Notes Textarea */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-slate-300 block font-bold">
              TECHNICIAN WORK ORDER COMPLETION LOG / OBSERVATIONS:
            </label>
            <textarea
              rows={2}
              value={technicianNotes}
              onChange={(e) => setTechnicianNotes(e.target.value)}
              placeholder="e.g. Strainer basket cleaned, no significant brass shavings detected in impeller housing. Modicon %MW100 stabilized at 1.15 Bar."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 font-mono focus:border-amber-500 outline-none"
            />
          </div>
        </div>

        {/* Modal Bottom Action Footer */}
        <div className="p-4 sm:p-5 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={handlePrintReport}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs flex items-center gap-1.5 transition"
          >
            <Printer className="w-4 h-4" />
            <span>Print Work Order</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs font-semibold transition"
            >
              Close
            </button>
            <button
              onClick={handleCompleteWorkOrder}
              disabled={completedCount === 0}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-mono text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-emerald-600/30"
            >
              <FileCheck className="w-4 h-4" />
              <span>Complete & Resolve Alert</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
