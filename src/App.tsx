/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  DeviceId,
  NetworkMetrics,
  SecurityLogEntry,
  SimulationStepId,
} from './types';
import {
  buildDevicesForStep,
  computeNetworkMetrics,
  PRESENTATION_STEPS,
  calculateRiskBreakdown,
} from './simulationEngine';
import { TopologyCanvas } from './components/TopologyCanvas';
import { BehaviourAnalysisPanel } from './components/BehaviourAnalysisPanel';
import { PerformanceChartsPanel } from './components/PerformanceChartsPanel';
import { DeviceTableAndLogs } from './components/DeviceTableAndLogs';
import {
  Play,
  Pause,
  RotateCcw,
  AlertTriangle,
  Shield,
  BarChart3,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';

function formatClock(baseSeconds: number): string {
  const mins = Math.floor(baseSeconds / 60);
  const secs = baseSeconds % 60;
  const mm = String(1 + (mins % 59)).padStart(2, '0');
  const ss = String(secs).padStart(2, '0');
  return `10:${mm}:${ss}`;
}

const INITIAL_LOGS: SecurityLogEntry[] = [
  {
    id: 'init-1',
    time: '10:01:01',
    level: 'info',
    device: 'S1',
    message: 'Virtual Switch S1 (Open vSwitch) initialized on ports eth1–eth5',
  },
  {
    id: 'init-2',
    time: '10:01:02',
    level: 'info',
    device: 'H1',
    message: 'H1 connected (10.0.0.1 / 00:00:00:00:00:01) — Trusted High-Priority',
  },
  {
    id: 'init-3',
    time: '10:01:02',
    level: 'info',
    device: 'H2',
    message: 'H2 connected (10.0.0.2 / 00:00:00:00:00:02) — Server / Receiver ready',
  },
  {
    id: 'init-4',
    time: '10:01:03',
    level: 'info',
    device: 'H4',
    message: 'H4 connected (10.0.0.4 / 00:00:00:00:00:04) — Trusted Normal Device',
  },
  {
    id: 'init-5',
    time: '10:01:04',
    level: 'warning',
    device: 'H5',
    message: 'H5 detected as unknown device (10.0.0.5) — placed under Behaviour Monitoring',
  },
  {
    id: 'init-6',
    time: '10:01:05',
    level: 'warning',
    device: 'H3',
    message: 'H3 joined network (10.0.0.3) — baseline behaviour collection started',
  },
];

export default function App() {
  const [currentStep, setCurrentStep] = useState<SimulationStepId>(2);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [elapsedSec, setElapsedSec] = useState<number>(6);
  const [jitterTick, setJitterTick] = useState<number>(0);
  const [selectedDeviceId, setSelectedDeviceId] = useState<DeviceId>('H3');
  const [customH3Bandwidth, setCustomH3Bandwidth] = useState<number | null>(
    null
  );
  const [logs, setLogs] = useState<SecurityLogEntry[]>(INITIAL_LOGS);
  const [highlightFinal, setHighlightFinal] = useState<boolean>(false);

  // Build baseline history so the live chart is immediately populated on first load
  const [history, setHistory] = useState<NetworkMetrics[]>(() => {
    const initialPoints: NetworkMetrics[] = [];
    for (let i = 0; i < 8; i++) {
      const devs = buildDevicesForStep(2, i, i * 0.7);
      initialPoints.push(
        computeNetworkMetrics(2, devs, formatClock(i + 1))
      );
    }
    return initialPoints;
  });

  const stepTickCounterRef = useRef<number>(0);

  const appendStepLogs = (step: SimulationStepId, sec: number) => {
    const t = formatClock(sec);
    const newEntries: SecurityLogEntry[] = [];

    if (step === 1) {
      newEntries.push({
        id: `log-${sec}-s1`,
        time: t,
        level: 'info',
        device: 'S1',
        message: 'All 5 virtual devices connected to S1. Behaviour monitoring active.',
      });
    } else if (step === 2) {
      newEntries.push({
        id: `log-${sec}-s2`,
        time: t,
        level: 'success',
        device: 'H1',
        message: 'Network operating normally — H1 throughput 9.55 Mbps, latency 1.67 ms',
      });
    } else if (step === 3) {
      newEntries.push(
        {
          id: `log-${sec}-s3a`,
          time: t,
          level: 'warning',
          device: 'H3',
          message: 'H3 traffic increased suddenly from 0.98 Mbps to 5.45 Mbps (UDP)',
        },
        {
          id: `log-${sec}-s3b`,
          time: t,
          level: 'warning',
          device: 'H3',
          message: 'Abnormal packet rate detected from H3 (>980 packets/sec)',
        }
      );
    } else if (step === 4) {
      newEntries.push({
        id: `log-${sec}-s4`,
        time: t,
        level: 'warning',
        device: 'H3',
        message:
          'Behaviour Analysis Engine: H3 risk score increased to 78/100 (Suspicious → Escalating)',
      });
    } else if (step === 5) {
      newEntries.push(
        {
          id: `log-${sec}-s5a`,
          time: t,
          level: 'critical',
          device: 'H3',
          message:
            '🚨 Rogue device detected: H3 (10.0.0.3) — Risk Score 87/100 (UDP flood 8.70 Mbps, 1850 pkt/s)',
        },
        {
          id: `log-${sec}-s5b`,
          time: t,
          level: 'warning',
          device: 'H1',
          message:
            'Congestion impact on S1: H1 bandwidth degraded to 4.62 Mbps, latency spiked to 18.42 ms',
        }
      );
    } else if (step === 6) {
      newEntries.push(
        {
          id: `log-${sec}-s6a`,
          time: t,
          level: 'qos',
          device: 'S1',
          message: 'QoS policy activated on Open vSwitch S1 via Linux tc HTB & OpenFlow meters',
        },
        {
          id: `log-${sec}-s6b`,
          time: t,
          level: 'qos',
          device: 'H3',
          message: 'H3 bandwidth limited to 3.00 Mbps maximum (Low Priority Queue)',
        }
      );
    } else if (step === 7) {
      newEntries.push({
        id: `log-${sec}-s7`,
        time: t,
        level: 'success',
        device: 'H1',
        message:
          'H1 traffic restored — Bandwidth recovered to 8.12 Mbps, latency reduced to 2.10 ms',
      });
    } else if (step === 8) {
      newEntries.push({
        id: `log-${sec}-s8`,
        time: t,
        level: 'success',
        device: 'S1',
        message:
          'Verification complete: Behaviour-Driven Rogue Device Detection mitigated H3 and protected network.',
      });
    }

    if (newEntries.length > 0) {
      setLogs((prev) => [...newEntries, ...prev].slice(0, 60));
    }
  };

  // Compute current devices (incorporating manual slider override if active)
  const rawDevices = buildDevicesForStep(currentStep, elapsedSec, jitterTick);
  const devices = rawDevices.map((dev) => {
    if (dev.id === 'H3' && customH3Bandwidth !== null) {
      const bw = customH3Bandwidth;
      const pps = Math.round(bw * 212);
      const proto = bw > 3.2 ? 'UDP' : 'TCP';
      const isFlood = bw > 6.0;
      const rb = calculateRiskBreakdown({
        id: 'H3',
        knownIdentity: false,
        packetsPerSec: pps,
        bandwidthMbps: bw,
        protocol: proto,
        isFloodPattern: isFlood,
      });
      const status =
        rb.total > 70 ? 'Rogue' : rb.total >= 40 ? 'Suspicious' : 'Monitoring';
      return {
        ...dev,
        bandwidthMbps: bw,
        packetsPerSec: pps,
        protocol: proto as 'UDP' | 'TCP',
        riskBreakdown: rb,
        riskScore: rb.total,
        status: status as typeof dev.status,
        behaviourLabel:
          bw > 6.0 ? 'Abnormal' : bw > 3.2 ? 'Elevating' : 'Normal',
        trafficLevelLabel:
          bw > 6.5 ? 'Very High' : bw > 3.5 ? 'High' : 'Low',
      } as typeof dev;
    }
    return dev;
  });

  const currentMetrics = computeNetworkMetrics(
    currentStep,
    devices,
    formatClock(elapsedSec)
  );

  // Live ticker when simulation is running
  useEffect(() => {
    if (!isRunning) return;

    const timer = setInterval(() => {
      setJitterTick((t) => t + 1);
      setElapsedSec((prevSec) => {
        const nextSec = prevSec + 1;
        stepTickCounterRef.current += 1;

        // Every 4 seconds in auto-simulation mode, advance to the next step until Step 8
        if (stepTickCounterRef.current >= 4) {
          stepTickCounterRef.current = 0;
          setCurrentStep((prevStep) => {
            if (prevStep < 8) {
              const nextStep = (prevStep + 1) as SimulationStepId;
              appendStepLogs(nextStep, nextSec);
              return nextStep;
            } else {
              setIsRunning(false);
              return prevStep;
            }
          });
        }
        return nextSec;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning]);

  // Append current metrics to history on step or tick updates
  useEffect(() => {
    setHistory((prev) => [...prev.slice(-24), currentMetrics]);
  }, [currentStep, jitterTick, customH3Bandwidth]);

  // Interactive Handlers
  const handleStartSimulation = () => {
    setCustomH3Bandwidth(null);
    stepTickCounterRef.current = 0;
    if (currentStep === 8) {
      setCurrentStep(1);
      appendStepLogs(1, elapsedSec + 1);
    }
    setIsRunning(true);
  };

  const handlePauseSimulation = () => {
    setIsRunning(false);
  };

  const handleResetNetwork = () => {
    setIsRunning(false);
    setCustomH3Bandwidth(null);
    setHighlightFinal(false);
    stepTickCounterRef.current = 0;
    setCurrentStep(2);
    setSelectedDeviceId('H3');
    setLogs(INITIAL_LOGS);
  };

  const handleGenerateAbnormalTraffic = () => {
    setCustomH3Bandwidth(null);
    setSelectedDeviceId('H3');
    stepTickCounterRef.current = 0;
    const nextStep: SimulationStepId = currentStep < 3 ? 3 : 5;
    setCurrentStep(nextStep);
    appendStepLogs(nextStep, elapsedSec + 1);
  };

  const handleApplyQoS = () => {
    setCustomH3Bandwidth(null);
    setSelectedDeviceId('H3');
    stepTickCounterRef.current = 0;
    const nextStep: SimulationStepId = currentStep === 6 ? 7 : 6;
    setCurrentStep(nextStep);
    appendStepLogs(nextStep, elapsedSec + 1);
  };

  const handleShowPerformance = () => {
    setHighlightFinal(true);
    const el = document.getElementById('performance-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
    setTimeout(() => setHighlightFinal(false), 2500);
  };

  const handleSelectStep = (step: SimulationStepId) => {
    setCustomH3Bandwidth(null);
    stepTickCounterRef.current = 0;
    setCurrentStep(step);
    appendStepLogs(step, elapsedSec + 1);
  };

  const activeStepDef =
    PRESENTATION_STEPS.find((s) => s.step === currentStep) ||
    PRESENTATION_STEPS[1];

  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-100 flex flex-col">
      {/* Top Bar Contract: Zone 1 (Single Brand Wordmark) — Zone 2 (4 Nav Links) — Zone 3 (Primary Actions) */}
      <header className="sticky top-0 z-30 bg-[#0B1120]/95 backdrop-blur-md border-b border-slate-800 px-6 py-3.5 flex items-center justify-between gap-4">
        <a
          href="#top"
          className="text-base sm:text-lg font-bold tracking-tight text-white whitespace-nowrap"
        >
          NetGuard Behaviour Sim
        </a>

        <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-300">
          <a
            href="#topology-section"
            className="hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap"
          >
            Topology &amp; Behaviour
          </a>
          <a
            href="#performance-section"
            className="hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap"
          >
            QoS &amp; Performance
          </a>
          <a
            href="#table-logs-section"
            className="hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap"
          >
            Device Table &amp; Logs
          </a>
          <a
            href="#conclusion-banner"
            className="hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap"
          >
            Project Summary
          </a>
        </nav>

        <div className="flex items-center gap-2.5">
          {!isRunning ? (
            <button
              type="button"
              onClick={handleStartSimulation}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg transition-colors whitespace-nowrap"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Start Simulation</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handlePauseSimulation}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors whitespace-nowrap"
            >
              <Pause className="w-3.5 h-3.5" />
              <span>Pause</span>
            </button>
          )}
          <button
            type="button"
            onClick={handleResetNetwork}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors whitespace-nowrap"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </header>

      {/* Main Content Container */}
      <main
        id="top"
        className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-6 py-5 space-y-5"
      >
        {/* Project Title & Interactive Control Deck */}
        <section className="bg-[#0F172A] border border-slate-800 rounded-xl p-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <div className="text-xs text-sky-400 font-medium mb-1">
                7th-Semester Computer Engineering Prototype · Virtual SDN / OpenFlow Security Simulation
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Behaviour Driven Rogue Device Detection in Computer Network
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Monitors network traffic → collects device behaviour → analyzes behaviour → detects suspicious/rogue devices → applies QoS/rate limiting → protects legitimate network traffic.
              </p>
            </div>

            {/* 6 Interactive Demonstration Controls (Section 12) */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={isRunning ? handlePauseSimulation : handleStartSimulation}
                className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  isRunning
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                }`}
              >
                {isRunning ? (
                  <>
                    <Pause className="w-3.5 h-3.5" />
                    <span>⏸ Pause Auto-Play</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    <span>▶ Start Simulation</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleGenerateAbnormalTraffic}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-amber-200 bg-amber-950/60 hover:bg-amber-900/70 border border-amber-500/50 rounded-lg transition-colors whitespace-nowrap"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>⚠️ Generate Abnormal Traffic</span>
              </button>

              <button
                type="button"
                onClick={handleApplyQoS}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-sky-200 bg-sky-950/60 hover:bg-sky-900/70 border border-sky-500/50 rounded-lg transition-colors whitespace-nowrap"
              >
                <Shield className="w-3.5 h-3.5 text-sky-400" />
                <span>🛡️ Apply QoS</span>
              </button>

              <button
                type="button"
                onClick={handleShowPerformance}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors whitespace-nowrap"
              >
                <BarChart3 className="w-3.5 h-3.5 text-sky-400" />
                <span>📊 Show Performance</span>
              </button>

              <button
                type="button"
                onClick={handleResetNetwork}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors whitespace-nowrap"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>🔄 Reset Network</span>
              </button>
            </div>
          </div>

          {/* 8-Step Presentation Sequence Bar (Section 16) */}
          <div className="mt-4">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-semibold text-slate-300">
                Presentation Demonstration Sequence (Click any step 1–8 or use Next/Prev):
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={currentStep <= 1}
                  onClick={() =>
                    handleSelectStep(
                      Math.max(1, currentStep - 1) as SimulationStepId
                    )
                  }
                  className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-40"
                  title="Previous Step"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono text-slate-400 tabular-nums px-1">
                  Step {currentStep} / 8
                </span>
                <button
                  type="button"
                  disabled={currentStep >= 8}
                  onClick={() =>
                    handleSelectStep(
                      Math.min(8, currentStep + 1) as SimulationStepId
                    )
                  }
                  className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-40"
                  title="Next Step"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-1.5">
              {PRESENTATION_STEPS.map((st) => {
                const isCurrent = st.step === currentStep;
                const isPassed = st.step < currentStep;
                return (
                  <button
                    key={st.step}
                    type="button"
                    onClick={() => handleSelectStep(st.step)}
                    className={`px-2.5 py-2 rounded-lg text-left border transition-all ${
                      isCurrent
                        ? st.step === 5
                          ? 'border-red-500 bg-red-950/40 text-white'
                          : 'border-sky-400 bg-sky-950/50 text-white'
                        : isPassed
                        ? 'border-slate-800 bg-slate-900/90 text-slate-300 hover:border-slate-700'
                        : 'border-slate-800/60 bg-slate-950/50 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-[11px] font-mono font-semibold truncate">
                      {st.shortTitle}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Active Presentation Step Status Banner */}
            <div
              className={`mt-3 p-3.5 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                currentStep === 5
                  ? 'border-red-500/80 bg-red-950/30 text-red-200'
                  : currentStep === 3 || currentStep === 4
                  ? 'border-amber-500/60 bg-amber-950/20 text-amber-200'
                  : currentStep >= 6
                  ? 'border-emerald-500/60 bg-emerald-950/20 text-emerald-200'
                  : 'border-sky-500/40 bg-slate-900/90 text-slate-100'
              }`}
            >
              <div>
                <div className="text-xs font-mono uppercase tracking-wider opacity-80">
                  {activeStepDef.title} · Pipeline: {activeStepDef.pipelineStage}
                </div>
                <div className="text-sm sm:text-base font-bold mt-0.5">
                  &ldquo;{activeStepDef.bannerMessage}&rdquo;
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  {activeStepDef.description}
                </p>
              </div>

              <div className="text-right font-mono text-xs shrink-0 tabular-nums">
                <div>H1 BW: {currentMetrics.h1BandwidthMbps.toFixed(2)} Mbps</div>
                <div>H3 BW: {currentMetrics.h3BandwidthMbps.toFixed(2)} Mbps</div>
                <div>Latency: {currentMetrics.latencyMs.toFixed(2)} ms</div>
              </div>
            </div>
          </div>
        </section>

        {/* Primary Workspace Grid: Left = Network Topology (7 cols), Right = Behaviour & Risk Analysis (5 cols) */}
        <section
          id="topology-section"
          className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch"
        >
          <div className="lg:col-span-7 flex">
            <TopologyCanvas
              devices={devices}
              selectedDeviceId={selectedDeviceId}
              onSelectDevice={setSelectedDeviceId}
              currentStep={currentStep}
              isRunning={isRunning}
            />
          </div>

          <div className="lg:col-span-5 flex">
            <BehaviourAnalysisPanel
              devices={devices}
              selectedDeviceId={selectedDeviceId}
              onSelectDevice={setSelectedDeviceId}
              currentStep={currentStep}
              customH3Bandwidth={customH3Bandwidth}
              onCustomH3BandwidthChange={setCustomH3Bandwidth}
            />
          </div>
        </section>

        {/* Network Performance & Before/After QoS Mitigation Section */}
        <section>
          <PerformanceChartsPanel
            currentMetrics={currentMetrics}
            history={history}
            currentStep={currentStep}
            highlightFinalResults={highlightFinal || currentStep === 8}
          />
        </section>

        {/* Live Device Table, Event Log, and Complete Project Logic Workflow */}
        <section id="table-logs-section">
          <DeviceTableAndLogs
            devices={devices}
            selectedDeviceId={selectedDeviceId}
            onSelectDevice={setSelectedDeviceId}
            logs={logs}
            onClearLogs={() => setLogs([])}
            currentStep={currentStep}
          />
        </section>

        {/* Section 17: Final Message & Project Principle Banner */}
        <section
          id="conclusion-banner"
          className="bg-[#0F172A] border border-sky-500/40 rounded-xl p-6 text-center"
        >
          <div className="text-xs font-mono text-sky-400 mb-1">
            PROJECT CONCLUSION &amp; CORE PRINCIPLE
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-white max-w-3xl mx-auto">
            &ldquo;Behaviour-Driven Rogue Device Detection Successfully Identified and Mitigated Abnormal Network Behaviour.&rdquo;
          </h2>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-sm sm:text-base font-semibold text-emerald-400">
            <span>Observe</span>
            <span className="text-slate-500">→</span>
            <span>Analyse</span>
            <span className="text-slate-500">→</span>
            <span>Detect</span>
            <span className="text-slate-500">→</span>
            <span>Respond</span>
            <span className="text-slate-500">→</span>
            <span>Protect</span>
          </div>
          <p className="text-xs text-slate-400 mt-3 max-w-2xl mx-auto">
            Software prototype modeling the logical workflow implemented with Mininet, Open vSwitch (OVS), Python, Scapy, Linux Traffic Control (tc HTB), and OpenFlow policies.
          </p>
        </section>
      </main>
    </div>
  );
}
