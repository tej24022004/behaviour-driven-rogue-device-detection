import React from 'react';
import { DeviceId, SimulationStepId, VirtualDevice } from '../types';
import { AlertTriangle, CheckCircle2, ShieldAlert, Sliders } from 'lucide-react';

interface BehaviourAnalysisPanelProps {
  devices: VirtualDevice[];
  selectedDeviceId: DeviceId;
  onSelectDevice: (id: DeviceId) => void;
  currentStep: SimulationStepId;
  customH3Bandwidth: number | null;
  onCustomH3BandwidthChange: (val: number | null) => void;
}

export const BehaviourAnalysisPanel: React.FC<BehaviourAnalysisPanelProps> = ({
  devices,
  selectedDeviceId,
  onSelectDevice,
  currentStep,
  customH3Bandwidth,
  onCustomH3BandwidthChange,
}) => {
  const selected = devices.find((d) => d.id === selectedDeviceId) || devices[2];
  const h3 = devices.find((d) => d.id === 'H3')!;

  const riskFactors = [
    {
      label: 'Packet Rate',
      current: selected.riskBreakdown.packetRatePoints,
      max: 25,
      detail: `${selected.packetsPerSec} pkts/sec`,
    },
    {
      label: 'Bandwidth Usage',
      current: selected.riskBreakdown.bandwidthPoints,
      max: 25,
      detail: `${selected.bandwidthMbps.toFixed(2)} Mbps`,
    },
    {
      label: 'Unknown Device Identity',
      current: selected.riskBreakdown.identityPoints,
      max: 20,
      detail: selected.knownIdentity ? 'Verified MAC' : 'Unregistered MAC',
    },
    {
      label: 'Protocol Behaviour',
      current: selected.riskBreakdown.protocolPoints,
      max: 15,
      detail: selected.protocol,
    },
    {
      label: 'Traffic Pattern / Burst',
      current: selected.riskBreakdown.patternPoints,
      max: 15,
      detail: selected.trafficPattern,
    },
  ];

  return (
    <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
      <div>
        {/* Panel Title & Device Selector Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-4 border-b border-slate-800">
          <div>
            <h2 className="text-base font-semibold text-white">
              Behaviour Monitoring & Risk Engine
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Real-time device telemetry and rule/threshold-based evaluation (0–100)
            </p>
          </div>

          {/* Functional Segmented Control for selecting H1-H5 */}
          <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg">
            {devices.map((dev) => (
              <button
                key={dev.id}
                type="button"
                onClick={() => onSelectDevice(dev.id)}
                className={`px-2.5 py-1 text-xs font-mono font-medium rounded-md transition-colors whitespace-nowrap ${
                  selected.id === dev.id
                    ? 'bg-sky-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {dev.id}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Device Live Telemetry Grid */}
        <div className="mb-4 p-3.5 rounded-lg bg-slate-900/90 border border-slate-800/90">
          <div className="flex items-center justify-between gap-2 mb-2.5 pb-2 border-b border-slate-800">
            <div>
              <span className="font-mono text-sm font-bold text-white">
                Device: {selected.id}
              </span>
              <span className="text-slate-500 mx-1.5">·</span>
              <span className="text-xs text-slate-300">{selected.roleLabel}</span>
            </div>
            <div className="text-xs font-mono tabular-nums">
              <span className="text-slate-400">Status: </span>
              <span
                className={
                  selected.status === 'Rogue'
                    ? 'text-red-400 font-semibold'
                    : selected.status === 'Suspicious'
                    ? 'text-amber-300 font-semibold'
                    : selected.status === 'Monitoring'
                    ? 'text-amber-200'
                    : 'text-emerald-400 font-semibold'
                }
              >
                {selected.status}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono tabular-nums">
            <div>
              <div className="text-slate-400 text-[11px] font-sans">Packets/sec</div>
              <div className="text-slate-100 font-semibold mt-0.5">
                {selected.packetsPerSec} pkt/s
              </div>
            </div>
            <div>
              <div className="text-slate-400 text-[11px] font-sans">Bandwidth</div>
              <div className="text-slate-100 font-semibold mt-0.5">
                {selected.bandwidthMbps.toFixed(2)} Mbps
              </div>
            </div>
            <div>
              <div className="text-slate-400 text-[11px] font-sans">Protocol</div>
              <div
                className={`font-semibold mt-0.5 ${
                  selected.protocol === 'UDP' ? 'text-amber-300' : 'text-slate-100'
                }`}
              >
                {selected.protocol}
              </div>
            </div>
            <div>
              <div className="text-slate-400 text-[11px] font-sans">Traffic Volume</div>
              <div className="text-slate-100 font-semibold mt-0.5">
                {selected.trafficVolumeMB.toFixed(1)} MB
              </div>
            </div>
            <div>
              <div className="text-slate-400 text-[11px] font-sans">Traffic Pattern</div>
              <div className="text-slate-200 mt-0.5 truncate">
                {selected.trafficPattern}
              </div>
            </div>
            <div>
              <div className="text-slate-400 text-[11px] font-sans">Conn. Duration</div>
              <div className="text-slate-200 mt-0.5">
                {selected.connectionDurationSec}s
              </div>
            </div>
            <div>
              <div className="text-slate-400 text-[11px] font-sans">Source IP</div>
              <div className="text-slate-200 mt-0.5">{selected.ip}</div>
            </div>
            <div>
              <div className="text-slate-400 text-[11px] font-sans">Source MAC</div>
              <div className="text-slate-200 mt-0.5 truncate">{selected.mac}</div>
            </div>
          </div>
        </div>

        {/* Multi-Factor Risk Score Breakdown (0-100) */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-200">
              Behaviour Risk Score Breakdown ({selected.id})
            </span>
            <span className="font-mono text-sm font-bold tabular-nums">
              Risk Score:{' '}
              <span
                className={
                  selected.riskScore > 70
                    ? 'text-red-400'
                    : selected.riskScore >= 40
                    ? 'text-amber-300'
                    : 'text-emerald-400'
                }
              >
                {selected.riskScore}/100 ({selected.riskScore}%)
              </span>
            </span>
          </div>

          <div className="space-y-2 bg-slate-900/60 border border-slate-800/80 rounded-lg p-3">
            {riskFactors.map((f) => {
              const pct = Math.min(100, Math.round((f.current / f.max) * 100));
              return (
                <div key={f.label} className="text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-300 font-medium">{f.label}</span>
                      <span className="text-slate-600">·</span>
                      <span className="font-mono text-[11px] text-slate-400">
                        {f.detail}
                      </span>
                    </div>
                    <span className="font-mono text-slate-200 tabular-nums">
                      {f.current} / {f.max} pts
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-200 ${
                        pct > 75
                          ? 'bg-red-500'
                          : pct > 45
                          ? 'bg-amber-400'
                          : 'bg-sky-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}

            {/* Threshold Classification Rules Bar */}
            <div className="pt-2.5 mt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-400">
              <span>Thresholds:</span>
              <span
                className={
                  selected.riskScore < 40 ? 'text-emerald-400 font-semibold' : ''
                }
              >
                &lt;40 Normal
              </span>
              <span>·</span>
              <span
                className={
                  selected.riskScore >= 40 && selected.riskScore <= 70
                    ? 'text-amber-300 font-semibold'
                    : ''
                }
              >
                40–70 Suspicious
              </span>
              <span>·</span>
              <span
                className={
                  selected.riskScore > 70 ? 'text-red-400 font-semibold' : ''
                }
              >
                &gt;70 Rogue
              </span>
            </div>
          </div>
        </div>

        {/* Manual Interactive Parameter Sandbox Slider for H3 Traffic */}
        <div className="mb-4 p-3 rounded-lg bg-slate-900/70 border border-slate-800">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <label
              htmlFor="h3-bw-slider"
              className="flex items-center gap-1.5 font-medium text-slate-300"
            >
              <Sliders className="w-3.5 h-3.5 text-sky-400" />
              <span>Test H3 Traffic Injection (Manual Override):</span>
            </label>
            <div className="flex items-center gap-2 font-mono tabular-nums">
              <span className="text-sky-300">
                {customH3Bandwidth !== null
                  ? `${customH3Bandwidth.toFixed(1)} Mbps (Manual)`
                  : `${h3.bandwidthMbps.toFixed(2)} Mbps (Step Auto)`}
              </span>
              {customH3Bandwidth !== null && (
                <button
                  type="button"
                  onClick={() => onCustomH3BandwidthChange(null)}
                  className="text-[11px] text-slate-400 hover:text-white underline"
                >
                  Reset Auto
                </button>
              )}
            </div>
          </div>
          <input
            id="h3-bw-slider"
            type="range"
            min="0.5"
            max="10.0"
            step="0.1"
            value={customH3Bandwidth !== null ? customH3Bandwidth : h3.bandwidthMbps}
            onChange={(e) => onCustomH3BandwidthChange(parseFloat(e.target.value))}
            className="w-full accent-sky-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
          />
          <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
            <span>0.5 Mbps (Normal)</span>
            <span>5.0 Mbps (Suspicious)</span>
            <span>8.7–10.0 Mbps (Rogue Flood)</span>
          </div>
        </div>
      </div>

      {/* Conditional Rogue Device Alert Card OR Active QoS Protection Status */}
      {h3.riskScore > 70 ? (
        <div
          className={`rounded-lg border p-3.5 transition-colors ${
            h3.qosActive
              ? 'border-amber-500/60 bg-amber-950/20'
              : 'border-red-500/80 bg-red-950/30'
          }`}
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
              <span className="text-xs font-bold tracking-wide text-red-300">
                🚨 ROGUE DEVICE DETECTED — H3 (IP: {h3.ip} · MAC: {h3.mac})
              </span>
            </div>
            <span className="font-mono text-xs font-bold text-red-400 whitespace-nowrap">
              Risk: {h3.riskScore}/100
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div>
              <div className="text-slate-400 text-[11px] mb-1">
                Detection Reasons:
              </div>
              <ul className="space-y-0.5 text-slate-200 text-[11px] list-disc list-inside">
                <li>Excessive traffic ({h3.qosActive ? '8.70 → ≤3.00' : h3.bandwidthMbps.toFixed(2)} Mbps)</li>
                <li>High packet rate ({h3.packetsPerSec} pkts/sec)</li>
                <li>Abnormal UDP flood behaviour</li>
                <li>Unusual bandwidth consumption</li>
              </ul>
            </div>

            <div className="border-t sm:border-t-0 sm:border-l border-slate-800 pt-2 sm:pt-0 sm:pl-3">
              <div className="text-slate-400 text-[11px] mb-1">
                QoS / Rate Limiting Mitigation:
              </div>
              {h3.qosActive ? (
                <div className="space-y-1 text-[11px] font-mono">
                  <div className="text-emerald-400 font-semibold">
                    ✓ QoS HTB Policy Active on S1
                  </div>
                  <div className="text-slate-300">
                    H3 → Low Priority → 3.0 Mbps max
                  </div>
                  <div className="text-slate-300">
                    H1 → High Priority → 7.0 Mbps min
                  </div>
                </div>
              ) : (
                <div className="space-y-1 text-[11px] font-mono text-amber-300">
                  <div>Status: ROGUE DEVICE (Unmitigated)</div>
                  <div className="text-slate-400 font-sans">
                    Click &ldquo;🛡️ Apply QoS&rdquo; or advance to Step 6 to throttle H3 to ≤3 Mbps.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            {currentStep >= 3 ? (
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span className="text-slate-300">
              {currentStep >= 3
                ? `H3 behaviour deviating from baseline (Risk ${h3.riskScore}/100 — Suspicious threshold 40–70)`
                : 'No rogue thresholds exceeded. All devices operating within normal behavioural bounds.'}
            </span>
          </div>
          <span className="font-mono text-slate-400 whitespace-nowrap ml-2">
            Max Risk: {Math.max(...devices.map((d) => d.riskScore))}%
          </span>
        </div>
      )}
    </div>
  );
};
