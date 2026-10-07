import React from 'react';
import { DeviceId, SimulationStepId, VirtualDevice } from '../types';
import { Server, ShieldCheck, ShieldAlert, Cpu, Network, Radio } from 'lucide-react';

interface TopologyCanvasProps {
  devices: VirtualDevice[];
  selectedDeviceId: DeviceId;
  onSelectDevice: (id: DeviceId) => void;
  currentStep: SimulationStepId;
  isRunning: boolean;
}

export const TopologyCanvas: React.FC<TopologyCanvasProps> = ({
  devices,
  selectedDeviceId,
  onSelectDevice,
  currentStep,
}) => {
  const getDevice = (id: DeviceId) => devices.find((d) => d.id === id)!;

  const h1 = getDevice('H1');
  const h2 = getDevice('H2');
  const h3 = getDevice('H3');
  const h4 = getDevice('H4');
  const h5 = getDevice('H5');

  const getStatusIndicator = (device: VirtualDevice) => {
    if (device.status === 'Rogue') {
      return {
        dot: '🔴',
        label: device.qosActive ? 'Rogue · Rate Limited' : 'Rogue Device',
        borderClass: 'border-red-500/80 bg-red-950/25',
        textClass: 'text-red-400',
        strokeColor: device.qosActive ? '#F59E0B' : '#EF4444',
      };
    }
    if (device.status === 'Suspicious') {
      return {
        dot: '🟡',
        label: 'Suspicious',
        borderClass: 'border-amber-500/80 bg-amber-950/20',
        textClass: 'text-amber-300',
        strokeColor: '#F59E0B',
      };
    }
    if (device.status === 'Monitoring') {
      return {
        dot: '🟡',
        label: 'Monitoring / Unknown',
        borderClass: 'border-amber-500/40 bg-slate-900/90',
        textClass: 'text-amber-300',
        strokeColor: '#EAB308',
      };
    }
    if (device.status === 'Server') {
      return {
        dot: '🟢',
        label: 'Server / Receiver',
        borderClass: 'border-sky-500/50 bg-slate-900/90',
        textClass: 'text-sky-300',
        strokeColor: '#38BDF8',
      };
    }
    return {
      dot: '🟢',
      label: device.qosActive ? 'Trusted · Prioritized' : 'Normal / Trusted',
      borderClass: 'border-emerald-500/50 bg-slate-900/90',
      textClass: 'text-emerald-400',
      strokeColor: '#10B981',
    };
  };

  // Determine H3 link animation class based on behaviour & QoS state
  const h3AnimClass =
    currentStep >= 3 && currentStep <= 5
      ? 'animate-packet-fast'
      : currentStep >= 6
      ? 'animate-packet-throttled'
      : 'animate-packet-normal';

  const h3StrokeWidth =
    currentStep >= 3 && currentStep <= 5 ? 4 : currentStep >= 6 ? 2.5 : 2;

  const h1StrokeWidth =
    currentStep === 5 ? 1.75 : currentStep >= 6 ? 3.5 : 2.75;

  const renderNodeCard = (
    device: VirtualDevice,
    positionClass: string
  ) => {
    const info = getStatusIndicator(device);
    const isSelected = selectedDeviceId === device.id;

    return (
      <button
        key={device.id}
        type="button"
        onClick={() => onSelectDevice(device.id)}
        className={`group text-left transition-all duration-150 rounded-xl border p-3.5 backdrop-blur-sm ${
          info.borderClass
        } ${
          isSelected
            ? 'ring-2 ring-sky-400 shadow-lg shadow-sky-950/50'
            : 'hover:border-slate-600'
        } ${positionClass}`}
      >
        {/* Top Row: ID + Role + Status */}
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-mono text-sm font-semibold text-white">
              {device.id}
            </span>
            <span className="text-slate-500" aria-hidden="true">
              ·
            </span>
            <span className="text-xs font-medium text-slate-300 truncate">
              {device.roleLabel}
            </span>
          </div>
          {device.isServer ? (
            <Server className="w-4 h-4 text-sky-400 shrink-0" />
          ) : device.status === 'Rogue' ? (
            <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
          ) : device.status === 'Trusted' ? (
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <Radio className="w-4 h-4 text-amber-400 shrink-0" />
          )}
        </div>

        {/* Status Indicator Line (Unboxed clean metadata per constitution) */}
        <div className="flex items-center gap-1.5 text-xs mb-2">
          <span>{info.dot}</span>
          <span className={`font-medium ${info.textClass}`}>{info.label}</span>
          <span className="text-slate-600">·</span>
          <span className="font-mono text-slate-300 tabular-nums">
            Risk {device.riskScore}%
          </span>
        </div>

        {/* IP & MAC Row */}
        <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 tabular-nums mb-2">
          <span>IP {device.ip}</span>
          <span className="text-slate-600">/</span>
          <span className="truncate">{device.mac}</span>
        </div>

        {/* Live Telemetry Footer */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono tabular-nums">
          <span className="text-slate-300">
            {device.bandwidthMbps.toFixed(2)} Mbps
          </span>
          <span className="text-slate-500">·</span>
          <span className="text-slate-300">{device.packetsPerSec} pkt/s</span>
          <span className="text-slate-500">·</span>
          <span
            className={
              device.protocol === 'UDP'
                ? 'text-amber-300 font-semibold'
                : 'text-slate-400'
            }
          >
            {device.protocol}
          </span>
        </div>
      </button>
    );
  };

  return (
    <div className="relative w-full bg-[#0F172A] border border-slate-800 rounded-xl p-5 overflow-hidden">
      {/* Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-800/80">
        <div>
          <h2 className="text-base font-semibold text-white">
            Virtual Network Topology (OpenFlow Switch S1)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Click any node H1–H5 to inspect live behaviour telemetry and multi-factor risk evaluation
          </p>
        </div>

        {/* Status Legend (Unboxed clean text with separators) */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
          <span>🟢 Normal / Trusted</span>
          <span className="text-slate-600">·</span>
          <span>🟡 Monitoring / Unknown</span>
          <span className="text-slate-600">·</span>
          <span>🔴 Suspicious / Rogue</span>
        </div>
      </div>

      {/* Interactive Topology Canvas */}
      <div className="relative min-h-[520px] w-full flex flex-col justify-between">
        {/* Background SVG Animated Packet Links */}
        <svg
          viewBox="0 0 900 500"
          className="w-full h-[520px] absolute inset-0 pointer-events-none select-none"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <radialGradient id="switchGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#0284C7" stopOpacity="0.24" />
              <stop offset="100%" stopColor="#0284C7" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Subtle center glow behind Virtual Switch S1 */}
          <circle cx="450" cy="245" r="95" fill="url(#switchGlow)" />

          {/* Base Physical Link Lines */}
          {/* H1 (Top: 450, 85) -> S1 (450, 245) */}
          <line
            x1="450"
            y1="95"
            x2="450"
            y2="215"
            stroke="#1E293B"
            strokeWidth="6"
          />
          <line
            x1="450"
            y1="95"
            x2="450"
            y2="215"
            stroke="#10B981"
            strokeWidth={h1StrokeWidth}
            className="animate-packet-normal"
          />

          {/* H4 (Left: 150, 245) -> S1 (450, 245) */}
          <line
            x1="230"
            y1="245"
            x2="385"
            y2="245"
            stroke="#1E293B"
            strokeWidth="5"
          />
          <line
            x1="230"
            y1="245"
            x2="385"
            y2="245"
            stroke="#10B981"
            strokeWidth="2"
            className="animate-packet-normal"
          />

          {/* S1 (450, 245) -> H2 Server (Right: 750, 245) */}
          <line
            x1="515"
            y1="245"
            x2="670"
            y2="245"
            stroke="#1E293B"
            strokeWidth="6"
          />
          <line
            x1="515"
            y1="245"
            x2="670"
            y2="245"
            stroke={currentStep === 5 ? '#EF4444' : '#38BDF8'}
            strokeWidth={currentStep === 5 ? 4 : 3}
            className={
              currentStep === 5 ? 'animate-packet-fast' : 'animate-packet-normal'
            }
          />

          {/* Trunk from S1 (450, 275) down to Branch Junction (450, 345) */}
          <line
            x1="450"
            y1="275"
            x2="450"
            y2="345"
            stroke="#1E293B"
            strokeWidth="6"
          />
          {/* Branch to H3 (Bottom-Left: 265, 405) */}
          <path
            d="M 270 390 L 270 345 L 450 345 L 450 275"
            fill="none"
            stroke="#1E293B"
            strokeWidth="6"
          />
          <path
            d="M 270 390 L 270 345 L 450 345 L 450 275"
            fill="none"
            stroke={getStatusIndicator(h3).strokeColor}
            strokeWidth={h3StrokeWidth}
            className={h3AnimClass}
          />

          {/* Branch to H5 (Bottom-Right: 635, 405) */}
          <path
            d="M 630 390 L 630 345 L 450 345"
            fill="none"
            stroke="#1E293B"
            strokeWidth="5"
          />
          <path
            d="M 630 390 L 630 345 L 450 345"
            fill="none"
            stroke="#EAB308"
            strokeWidth="2"
            className="animate-packet-normal"
          />

          {/* Port Rate Callout Annotations on Canvas */}
          <g className="font-mono text-[11px]" fill="#94A3B8">
            <text x="462" y="162" fill="#34D399">
              eth1: {h1.bandwidthMbps.toFixed(2)} Mbps {h1.qosActive ? '(High Prio ≥7M)' : ''}
            </text>
            <text x="275" y="232" fill="#6EE7B7">
              eth4: {h4.bandwidthMbps.toFixed(2)} Mbps
            </text>
            <text x="530" y="232" fill="#38BDF8">
              eth2 (Uplink): {h2.bandwidthMbps.toFixed(2)} Mbps
            </text>
            <text
              x="220"
              y="335"
              fill={
                h3.status === 'Rogue'
                  ? h3.qosActive
                    ? '#FBBF24'
                    : '#F87171'
                  : '#CBD5E1'
              }
            >
              eth3: {h3.bandwidthMbps.toFixed(2)} Mbps{' '}
              {h3.qosActive
                ? '[HTB Capped ≤3.0 Mbps]'
                : h3.status === 'Rogue'
                ? '[UDP FLOOD!]'
                : ''}
            </text>
            <text x="485" y="335" fill="#FDE047">
              eth5: {h5.bandwidthMbps.toFixed(2)} Mbps (Monitored)
            </text>
          </g>
        </svg>

        {/* Top Tier: H1 (Trusted High-Priority Device) */}
        <div className="relative z-10 flex justify-center">
          {renderNodeCard(h1, 'w-full max-w-[265px]')}
        </div>

        {/* Middle Tier: H4 (Left) — S1 Virtual Switch (Center) — H2 Server (Right) */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 items-center gap-4 my-4">
          <div className="flex justify-start">
            {renderNodeCard(h4, 'w-full max-w-[255px]')}
          </div>

          {/* Center Node: S1 Virtual Switch */}
          <div className="flex justify-center">
            <div className="w-full max-w-[235px] rounded-xl border border-sky-500/60 bg-slate-900/95 p-3.5 text-center shadow-lg">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Network className="w-4 h-4 text-sky-400" />
                <span className="font-mono text-sm font-bold text-white">
                  S1 · Virtual Switch
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mb-2">
                Open vSwitch · Behaviour Engine
              </p>
              <div className="pt-2 border-t border-slate-800 flex items-center justify-center gap-2 text-[11px] font-mono tabular-nums">
                <Cpu className="w-3.5 h-3.5 text-sky-400" />
                <span className="text-sky-300">
                  {currentStep >= 6
                    ? 'QoS HTB Policy: ACTIVE'
                    : currentStep === 5
                    ? 'ALERT: Queue Congested'
                    : 'OpenFlow Telemetry: ON'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            {renderNodeCard(h2, 'w-full max-w-[255px]')}
          </div>
        </div>

        {/* Bottom Tier: H3 (Unknown/Suspicious) & H5 (New/Unknown) */}
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
          <div className="flex justify-center sm:justify-end sm:pr-8">
            {renderNodeCard(h3, 'w-full max-w-[275px]')}
          </div>
          <div className="flex justify-center sm:justify-start sm:pl-8">
            {renderNodeCard(h5, 'w-full max-w-[275px]')}
          </div>
        </div>
      </div>
    </div>
  );
};
