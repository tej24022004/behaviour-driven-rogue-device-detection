import React from 'react';
import { NetworkMetrics, SimulationStepId } from '../types';

interface PerformanceChartsPanelProps {
  currentMetrics: NetworkMetrics;
  history: NetworkMetrics[];
  currentStep: SimulationStepId;
  highlightFinalResults: boolean;
}

export const PerformanceChartsPanel: React.FC<PerformanceChartsPanelProps> = ({
  currentMetrics,
  history,
  currentStep,
  highlightFinalResults,
}) => {
  // Experimental Benchmark Data from Project Specification
  const benchmarks = [
    {
      phase: '1. Baseline (Normal)',
      shortPhase: 'Normal',
      h1Bandwidth: 9.55,
      h3Bandwidth: 0.98,
      latency: 1.67,
      statusText: 'Optimal Baseline',
      active: currentStep <= 2,
    },
    {
      phase: '2. Abnormal / Rogue Flood',
      shortPhase: 'Abnormal (Rogue)',
      h1Bandwidth: 4.62,
      h3Bandwidth: 8.7,
      latency: 18.42,
      statusText: '-51.6% Throughput Drop',
      active: currentStep >= 3 && currentStep <= 5,
    },
    {
      phase: '3. After QoS Mitigation',
      shortPhase: 'After QoS',
      h1Bandwidth: 8.12,
      h3Bandwidth: 3.0,
      latency: 2.1,
      statusText: '+75.8% Recovery · 2.10 ms',
      active: currentStep >= 6,
    },
  ];

  // Build SVG polyline points for live time-series chart
  const chartWidth = 560;
  const chartHeight = 155;
  const maxBw = 11.0;
  const maxLat = 22.0;

  const displayHistory = history.slice(-20);

  const buildPolyline = (
    extractor: (m: NetworkMetrics) => number,
    maxValue: number
  ) => {
    if (displayHistory.length === 0) return '';
    return displayHistory
      .map((item, idx) => {
        const x =
          displayHistory.length === 1
            ? chartWidth / 2
            : (idx / (displayHistory.length - 1)) * (chartWidth - 24) + 12;
        const y =
          chartHeight -
          16 -
          Math.min(1, Math.max(0, extractor(item) / maxValue)) *
            (chartHeight - 32);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  };

  const h1Points = buildPolyline((m) => m.h1BandwidthMbps, maxBw);
  const h3Points = buildPolyline((m) => m.h3BandwidthMbps, maxBw);
  const latPoints = buildPolyline((m) => m.latencyMs, maxLat);

  return (
    <div
      id="performance-section"
      className={`bg-[#0F172A] border rounded-xl p-5 transition-colors ${
        highlightFinalResults
          ? 'border-sky-500/80 ring-1 ring-sky-500/40'
          : 'border-slate-800'
      }`}
    >
      {/* Top Header & Live Telemetry KPI Strip */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 mb-4 border-b border-slate-800">
        <div>
          <h2 className="text-base font-semibold text-white">
            Network Performance & Before/After QoS Mitigation Analysis
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Live throughput, latency, congestion telemetry, and experimental benchmark comparison
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono tabular-nums">
          <span className="text-emerald-400">
            ● H1 Bandwidth: {currentMetrics.h1BandwidthMbps.toFixed(2)} Mbps
          </span>
          <span className="text-slate-600">·</span>
          <span className="text-red-400">
            ● H3 Bandwidth: {currentMetrics.h3BandwidthMbps.toFixed(2)} Mbps
          </span>
          <span className="text-slate-600">·</span>
          <span className="text-amber-300">
            ▲ Latency: {currentMetrics.latencyMs.toFixed(2)} ms
          </span>
        </div>
      </div>

      {/* 6 Live Performance Indicators Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
        <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800">
          <div className="text-[11px] text-slate-400">H1 Legitimate BW</div>
          <div className="font-mono text-base font-bold text-emerald-400 tabular-nums mt-0.5">
            {currentMetrics.h1BandwidthMbps.toFixed(2)} Mbps
          </div>
          <div className="text-[11px] text-slate-500 font-mono mt-0.5">
            Target ≥ 7.00 Mbps
          </div>
        </div>

        <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800">
          <div className="text-[11px] text-slate-400">H3 Traffic Load</div>
          <div className="font-mono text-base font-bold text-red-400 tabular-nums mt-0.5">
            {currentMetrics.h3BandwidthMbps.toFixed(2)} Mbps
          </div>
          <div className="text-[11px] text-slate-500 font-mono mt-0.5">
            {currentStep >= 6 ? 'QoS Cap ≤ 3.00 Mbps' : 'Unthrottled Port'}
          </div>
        </div>

        <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800">
          <div className="text-[11px] text-slate-400">Network Latency</div>
          <div
            className={`font-mono text-base font-bold tabular-nums mt-0.5 ${
              currentMetrics.latencyMs > 10
                ? 'text-red-400'
                : currentMetrics.latencyMs > 4
                ? 'text-amber-300'
                : 'text-sky-300'
            }`}
          >
            {currentMetrics.latencyMs.toFixed(2)} ms
          </div>
          <div className="text-[11px] text-slate-500 font-mono mt-0.5">
            Baseline: 1.67 ms
          </div>
        </div>

        <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800">
          <div className="text-[11px] text-slate-400">Total Throughput</div>
          <div className="font-mono text-base font-bold text-slate-100 tabular-nums mt-0.5">
            {currentMetrics.totalThroughputMbps.toFixed(2)} Mbps
          </div>
          <div className="text-[11px] text-slate-500 font-mono mt-0.5">
            S1 Backplane
          </div>
        </div>

        <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800">
          <div className="text-[11px] text-slate-400">Aggregate Packet Rate</div>
          <div className="font-mono text-base font-bold text-slate-100 tabular-nums mt-0.5">
            {currentMetrics.totalPacketsPerSec} pkt/s
          </div>
          <div className="text-[11px] text-slate-500 font-mono mt-0.5">
            Vol: {currentMetrics.trafficVolumeMB.toFixed(1)} MB
          </div>
        </div>

        <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800">
          <div className="text-[11px] text-slate-400">Switch Congestion</div>
          <div
            className={`font-mono text-base font-bold tabular-nums mt-0.5 ${
              currentMetrics.congestionPercent > 75
                ? 'text-red-400'
                : currentMetrics.congestionPercent > 45
                ? 'text-amber-300'
                : 'text-emerald-400'
            }`}
          >
            {currentMetrics.congestionPercent}%
          </div>
          <div className="text-[11px] text-slate-500 font-mono mt-0.5">
            {currentMetrics.congestionPercent > 75
              ? 'Queue Saturated'
              : 'Nominal Queue'}
          </div>
        </div>
      </div>

      {/* Main Charts Grid: Left = Live Telemetry Stream, Right = Before vs Abnormal vs After QoS Bar Graph */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left: Real-time Telemetry Waveform */}
        <div className="p-4 rounded-lg bg-slate-900/70 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-200">
              Live Telemetry Stream (H1 vs H3 Bandwidth & Latency)
            </span>
            <div className="flex items-center gap-3 text-[11px] font-mono">
              <span className="text-emerald-400">— H1 (Mbps)</span>
              <span className="text-red-400">— H3 (Mbps)</span>
              <span className="text-amber-300">-- Latency (ms)</span>
            </div>
          </div>

          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="w-full h-40 bg-slate-950/60 rounded border border-slate-800/80"
          >
            {/* Horizontal Reference Grid Lines */}
            {[0.25, 0.5, 0.75].map((ratio) => (
              <line
                key={ratio}
                x1="0"
                y1={chartHeight * ratio}
                x2={chartWidth}
                y2={chartHeight * ratio}
                stroke="#1E293B"
                strokeDasharray="3 3"
                strokeWidth="1"
              />
            ))}

            {/* 3.0 Mbps QoS Cap Line */}
            <line
              x1="0"
              y1={chartHeight - 16 - (3.0 / maxBw) * (chartHeight - 32)}
              x2={chartWidth}
              y2={chartHeight - 16 - (3.0 / maxBw) * (chartHeight - 32)}
              stroke="#0284C7"
              strokeDasharray="4 4"
              strokeWidth="1"
            />
            <text
              x="8"
              y={chartHeight - 20 - (3.0 / maxBw) * (chartHeight - 32)}
              fill="#38BDF8"
              className="text-[9px] font-mono"
            >
              H3 QoS Limit (3.0 Mbps)
            </text>

            {/* Latency Dashed Curve */}
            {latPoints && (
              <polyline
                fill="none"
                stroke="#FBBF24"
                strokeWidth="1.75"
                strokeDasharray="4 3"
                points={latPoints}
              />
            )}

            {/* H3 Bandwidth Line */}
            {h3Points && (
              <polyline
                fill="none"
                stroke="#F87171"
                strokeWidth="2.5"
                points={h3Points}
              />
            )}

            {/* H1 Bandwidth Line */}
            {h1Points && (
              <polyline
                fill="none"
                stroke="#10B981"
                strokeWidth="2.5"
                points={h1Points}
              />
            )}
          </svg>

          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 font-mono">
            <span>Baseline: 9.55 Mbps / 1.67 ms</span>
            <span>Flood: 4.62 Mbps / 18.42 ms</span>
            <span>Post-QoS: 8.12 Mbps / 2.10 ms</span>
          </div>
        </div>

        {/* Right: Experimental Comparison Graph (Normal vs Abnormal Traffic vs After QoS) */}
        <div className="p-4 rounded-lg bg-slate-900/70 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-200">
              Experimental Comparison: Normal vs Abnormal vs After QoS
            </span>
            <span className="text-[11px] font-mono text-sky-400">
              H1 Priority Protection
            </span>
          </div>

          <div className="space-y-3">
            {benchmarks.map((b) => {
              const bwPct = Math.round((b.h1Bandwidth / 10.0) * 100);
              const latPct = Math.round((b.latency / 20.0) * 100);
              return (
                <div
                  key={b.phase}
                  className={`p-2.5 rounded-lg border transition-colors ${
                    b.active
                      ? 'border-sky-500/60 bg-slate-900'
                      : 'border-slate-800/80 bg-slate-950/40'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-semibold text-slate-200">
                      {b.phase}
                    </span>
                    <span className="font-mono text-[11px] text-slate-400 tabular-nums">
                      {b.statusText}
                    </span>
                  </div>

                  {/* H1 Bandwidth Bar */}
                  <div className="grid grid-cols-12 items-center gap-2 text-[11px] font-mono tabular-nums mb-1">
                    <span className="col-span-3 text-slate-400">H1 Bandwidth</span>
                    <div className="col-span-6 h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${bwPct}%` }}
                      />
                    </div>
                    <span className="col-span-3 text-right text-emerald-400 font-semibold">
                      {b.h1Bandwidth.toFixed(2)} Mbps
                    </span>
                  </div>

                  {/* Latency Bar */}
                  <div className="grid grid-cols-12 items-center gap-2 text-[11px] font-mono tabular-nums">
                    <span className="col-span-3 text-slate-400">H1 Latency</span>
                    <div className="col-span-6 h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          b.latency > 10 ? 'bg-red-500' : 'bg-sky-400'
                        }`}
                        style={{ width: `${latPct}%` }}
                      />
                    </div>
                    <span
                      className={`col-span-3 text-right font-semibold ${
                        b.latency > 10 ? 'text-red-400' : 'text-sky-300'
                      }`}
                    >
                      {b.latency.toFixed(2)} ms
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Section 13: Final Results Summary Panel (Always visible at bottom of Performance Panel, highlighted in Step 8) */}
      <div className="mt-5 pt-4 border-t border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Detection Result Card */}
        <div className="p-3.5 rounded-lg bg-slate-900/90 border border-slate-800">
          <div className="text-xs font-semibold text-white mb-2">
            Detection Result Summary
          </div>
          <div className="space-y-1 text-xs font-mono tabular-nums">
            <div className="flex justify-between">
              <span className="text-slate-400">Rogue Device:</span>
              <span className="text-red-400 font-semibold">H3 (10.0.0.3)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Detection Method:</span>
              <span className="text-slate-200">Behaviour Analysis</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Peak Risk Score:</span>
              <span className="text-red-400 font-semibold">87 / 100</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Reason:</span>
              <span className="text-amber-300">Abnormal high-volume UDP</span>
            </div>
          </div>
        </div>

        {/* Network Protection Result: Before Mitigation */}
        <div className="p-3.5 rounded-lg bg-slate-900/90 border border-slate-800">
          <div className="text-xs font-semibold text-white mb-2">
            Before Mitigation (During Rogue Flood)
          </div>
          <div className="space-y-1 text-xs font-mono tabular-nums">
            <div className="flex justify-between">
              <span className="text-slate-400">H1 Bandwidth:</span>
              <span className="text-red-400 font-semibold">4.62 Mbps</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">H1 Latency:</span>
              <span className="text-red-400 font-semibold">18.42 ms</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">H3 Rogue Bandwidth:</span>
              <span className="text-red-400">8.70 Mbps (Unchecked)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Switch S1 Status:</span>
              <span className="text-amber-300">Severe Congestion</span>
            </div>
          </div>
        </div>

        {/* Network Protection Result: After QoS Mitigation */}
        <div className="p-3.5 rounded-lg bg-slate-900/90 border border-emerald-500/40">
          <div className="text-xs font-semibold text-emerald-400 mb-2">
            After QoS Mitigation (HTB + Priority)
          </div>
          <div className="space-y-1 text-xs font-mono tabular-nums">
            <div className="flex justify-between">
              <span className="text-slate-400">H1 Bandwidth:</span>
              <span className="text-emerald-400 font-semibold">
                8.12 Mbps (Restored)
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">H1 Latency:</span>
              <span className="text-emerald-400 font-semibold">
                2.10 ms (Stabilized)
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">H3 Rate Limit:</span>
              <span className="text-amber-300">3.00 Mbps Maximum</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">H1 SLA Guarantee:</span>
              <span className="text-sky-300">≥ 7.00 Mbps High Priority</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
