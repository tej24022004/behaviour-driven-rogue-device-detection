import React, { useState } from 'react';
import {
  DeviceId,
  SecurityLogEntry,
  SimulationStepId,
  VirtualDevice,
} from '../types';
import { Terminal, ArrowRight } from 'lucide-react';

interface DeviceTableAndLogsProps {
  devices: VirtualDevice[];
  selectedDeviceId: DeviceId;
  onSelectDevice: (id: DeviceId) => void;
  logs: SecurityLogEntry[];
  onClearLogs: () => void;
  currentStep: SimulationStepId;
}

export const DeviceTableAndLogs: React.FC<DeviceTableAndLogsProps> = ({
  devices,
  selectedDeviceId,
  onSelectDevice,
  logs,
  onClearLogs,
  currentStep,
}) => {
  const [filter, setFilter] = useState<'all' | 'trusted' | 'flagged'>('all');

  const filteredDevices = devices.filter((d) => {
    if (filter === 'trusted') {
      return d.status === 'Trusted' || d.status === 'Server';
    }
    if (filter === 'flagged') {
      return (
        d.status === 'Monitoring' ||
        d.status === 'Suspicious' ||
        d.status === 'Rogue'
      );
    }
    return true;
  });

  const workflowStages = [
    { label: '1. Device Monitoring', active: currentStep >= 1 },
    { label: '2. Behaviour Collection', active: currentStep >= 2 },
    { label: '3. Behaviour Analysis', active: currentStep >= 3 },
    { label: '4. Risk Evaluation (0–100)', active: currentStep >= 4 },
    { label: '5. Rogue Detection (>70)', active: currentStep >= 5, alert: currentStep === 5 },
    { label: '6. QoS Rate Limiting (≤3 Mbps)', active: currentStep >= 6 },
    { label: '7. Network Protection', active: currentStep >= 7 },
  ];

  return (
    <div className="space-y-5">
      {/* Row 1: Live Device Table + Security Event Log */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Live Device Table (7 columns) */}
        <div className="lg:col-span-7 bg-[#0F172A] border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-800">
              <div>
                <h2 className="text-base font-semibold text-white">
                  Live Virtual Device Table
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Real-time behavioural classification and active OpenFlow / QoS enforcement state
                </p>
              </div>

              {/* Filter Control */}
              <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg">
                <button
                  type="button"
                  onClick={() => setFilter('all')}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                    filter === 'all'
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  All ({devices.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilter('trusted')}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                    filter === 'trusted'
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Trusted
                </button>
                <button
                  type="button"
                  onClick={() => setFilter('flagged')}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                    filter === 'flagged'
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Monitored / Rogue
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] font-medium text-slate-400">
                    <th className="py-2.5 px-2.5">Device</th>
                    <th className="py-2.5 px-2.5">IP</th>
                    <th className="py-2.5 px-2.5">Behaviour</th>
                    <th className="py-2.5 px-2.5">Traffic</th>
                    <th className="py-2.5 px-2.5 text-right">Risk</th>
                    <th className="py-2.5 px-2.5">Status</th>
                    <th className="py-2.5 px-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70 text-xs">
                  {filteredDevices.map((d) => {
                    const isSelected = d.id === selectedDeviceId;
                    return (
                      <tr
                        key={d.id}
                        onClick={() => onSelectDevice(d.id)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-sky-950/35'
                            : d.status === 'Rogue'
                            ? 'bg-red-950/15 hover:bg-red-950/25'
                            : 'hover:bg-slate-900/70'
                        }`}
                      >
                        <td className="py-2.5 px-2.5 font-mono font-semibold text-white whitespace-nowrap">
                          {d.id}
                        </td>
                        <td className="py-2.5 px-2.5 font-mono text-slate-300 tabular-nums whitespace-nowrap">
                          {d.ip}
                        </td>
                        <td
                          className={`py-2.5 px-2.5 font-medium whitespace-nowrap ${
                            d.behaviourLabel === 'Abnormal'
                              ? 'text-red-400'
                              : d.behaviourLabel === 'Elevating' ||
                                d.behaviourLabel === 'Unknown'
                              ? 'text-amber-300'
                              : 'text-slate-200'
                          }`}
                        >
                          {d.behaviourLabel}
                        </td>
                        <td className="py-2.5 px-2.5 font-mono text-slate-300 tabular-nums whitespace-nowrap">
                          {d.trafficLevelLabel}{' '}
                          <span className="text-slate-500">
                            ({d.bandwidthMbps.toFixed(2)}M)
                          </span>
                        </td>
                        <td
                          className={`py-2.5 px-2.5 font-mono font-bold text-right tabular-nums whitespace-nowrap ${
                            d.riskScore > 70
                              ? 'text-red-400'
                              : d.riskScore >= 40
                              ? 'text-amber-300'
                              : 'text-emerald-400'
                          }`}
                        >
                          {d.riskScore}%
                        </td>
                        <td
                          className={`py-2.5 px-2.5 font-semibold whitespace-nowrap ${
                            d.status === 'Rogue'
                              ? 'text-red-400'
                              : d.status === 'Suspicious' ||
                                d.status === 'Monitoring'
                              ? 'text-amber-300'
                              : d.status === 'Server'
                              ? 'text-sky-300'
                              : 'text-emerald-400'
                          }`}
                        >
                          {d.status}
                        </td>
                        <td
                          className={`py-2.5 px-2.5 font-mono text-right whitespace-nowrap ${
                            d.action.includes('Rate Limited')
                              ? 'text-amber-300 font-semibold'
                              : d.action.includes('Prioritized')
                              ? 'text-emerald-400 font-semibold'
                              : 'text-slate-300'
                          }`}
                        >
                          {d.action}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-[11px] text-slate-400">
            <span>
              Core Principle: Classification is driven by live traffic behaviour, not static IP/MAC filtering.
            </span>
            <span className="font-mono text-slate-300">
              Selected: {selectedDeviceId}
            </span>
          </div>
        </div>

        {/* Live Security & Event Log (5 columns) */}
        <div className="lg:col-span-5 bg-[#0F172A] border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-sky-400" />
                <div>
                  <h2 className="text-base font-semibold text-white">
                    Event & Security Log
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Chronological audit trail from S1 Behaviour Engine & QoS Controller
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClearLogs}
                className="px-2.5 py-1 text-xs font-medium text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded-lg transition-colors whitespace-nowrap"
              >
                Clear Log
              </button>
            </div>

            <div className="h-[235px] overflow-y-auto space-y-1.5 pr-1 font-mono text-xs bg-slate-950/70 border border-slate-800/90 rounded-lg p-3">
              {logs.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                  Event log cleared. Advance or start simulation to record new events.
                </div>
              ) : (
                logs.map((entry) => (
                  <div
                    key={entry.id}
                    className={`leading-relaxed py-0.5 ${
                      entry.level === 'critical'
                        ? 'text-red-400 font-semibold'
                        : entry.level === 'qos'
                        ? 'text-sky-300 font-medium'
                        : entry.level === 'warning'
                        ? 'text-amber-300'
                        : entry.level === 'success'
                        ? 'text-emerald-400 font-medium'
                        : 'text-slate-300'
                    }`}
                  >
                    <span className="text-slate-500 tabular-nums mr-2">
                      [{entry.time}]
                    </span>
                    <span>{entry.message}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>Stack: Open vSwitch · Linux tc (HTB) · OpenFlow</span>
            <span>Entries: {logs.length}</span>
          </div>
        </div>
      </div>

      {/* Row 2: Complete Project Logic Pipeline & Decision Architecture */}
      <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div>
            <h2 className="text-base font-semibold text-white">
              System Architecture & Behaviour-Driven Decision Pipeline
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Observe → Analyse → Detect → Respond → Protect
            </p>
          </div>
          <span className="text-xs font-mono text-sky-400">
            Active Stage: Step {currentStep} of 8
          </span>
        </div>

        {/* Interactive Pipeline Chain */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-2.5 items-center">
          {workflowStages.map((st, idx) => (
            <div key={st.label} className="flex items-center gap-2">
              <div
                className={`flex-1 p-2.5 rounded-lg border text-xs font-medium transition-colors ${
                  st.alert
                    ? 'border-red-500 bg-red-950/35 text-red-300 font-semibold'
                    : st.active
                    ? 'border-sky-500/60 bg-slate-900 text-slate-100'
                    : 'border-slate-800 bg-slate-950/40 text-slate-500'
                }`}
              >
                <div className="truncate">{st.label}</div>
                <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                  {st.active ? '● Active / Verified' : '○ Pending'}
                </div>
              </div>
              {idx < workflowStages.length - 1 && (
                <ArrowRight className="w-3.5 h-3.5 text-slate-600 hidden lg:block shrink-0" />
              )}
            </div>
          ))}
        </div>

        {/* Branching Logic Explanation Footer */}
        <div className="mt-3 pt-3 border-t border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
          <div className="text-emerald-400">
            Branch A (Risk ≤ 70): NORMAL / MONITORED → Action: ALLOW &amp; PRIORITIZE H1 (≥7.0 Mbps)
          </div>
          <div className="text-amber-300 md:text-right">
            Branch B (Risk &gt; 70): ROGUE DETECTED → Action: QoS RESPONSE → HTB RATE LIMIT (≤3.0 Mbps)
          </div>
        </div>
      </div>
    </div>
  );
};
