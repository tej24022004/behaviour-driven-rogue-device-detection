import {
  DeviceId,
  DeviceStatus,
  NetworkMetrics,
  PolicyAction,
  RiskBreakdown,
  SimulationStepId,
  StepDefinition,
  VirtualDevice,
} from './types';

export const PRESENTATION_STEPS: StepDefinition[] = [
  {
    step: 1,
    title: 'Step 1: Topology & Device Monitoring',
    shortTitle: '1. Monitoring',
    bannerMessage: 'All devices are being monitored.',
    description:
      'Virtual switch S1 initializes OpenFlow telemetry ports and begins continuous behaviour observation across H1–H5 without static MAC blacklisting.',
    pipelineStage: 'DEVICE MONITORING',
  },
  {
    step: 2,
    title: 'Step 2: Normal Network Operation',
    shortTitle: '2. Normal Traffic',
    bannerMessage: 'Network Operating Normally',
    description:
      'H1 communicates with Server H2 at 9.55 Mbps with 1.67 ms latency. H4 generates light TCP traffic. H3 and H5 are monitored for behavioural deviations.',
    pipelineStage: 'BEHAVIOUR COLLECTION',
  },
  {
    step: 3,
    title: 'Step 3: Abnormal Traffic Onset (H3)',
    shortTitle: '3. Traffic Surge',
    bannerMessage: "The system observes a sudden change in H3's behaviour.",
    description:
      'Device H3 shifts from low-rate TCP to high-frequency UDP bursts. Packet rate climbs past 950 pkts/s and bandwidth usage surges past 5.4 Mbps.',
    pipelineStage: 'BEHAVIOUR ANALYSIS',
  },
  {
    step: 4,
    title: 'Step 4: Behaviour Analysis & Risk Elevation',
    shortTitle: '4. Risk Analysis',
    bannerMessage: 'The behaviour-analysis engine identifies abnormal activity.',
    description:
      'Multi-factor scoring evaluates packet rate, bandwidth share, unknown identity, and UDP flood signature. H3 risk rises into the 40–70 Suspicious band.',
    pipelineStage: 'RISK EVALUATION',
  },
  {
    step: 5,
    title: 'Step 5: Rogue Device Detection',
    shortTitle: '5. Rogue Alert',
    bannerMessage: '🚨 ROGUE DEVICE DETECTED – H3',
    description:
      'H3 reaches 1,850 pkts/s and 8.70 Mbps (Risk Score: 87/100 > 70 threshold). Legitimate H1 throughput drops to 4.62 Mbps and latency spikes to 18.42 ms.',
    pipelineStage: 'ROGUE DETECTION',
  },
  {
    step: 6,
    title: 'Step 6: Automated QoS & Rate Limiting',
    shortTitle: '6. QoS Mitigation',
    bannerMessage: 'The suspicious device is restricted to protect legitimate traffic.',
    description:
      'Switch S1 applies Linux tc HTB & OpenFlow meter policy: H3 is rate-limited to 3.00 Mbps maximum (Low Priority) while H1 is guaranteed ≥7.00 Mbps (High Priority).',
    pipelineStage: 'QoS RESPONSE',
  },
  {
    step: 7,
    title: 'Step 7: Network Performance Restored',
    shortTitle: '7. Restored',
    bannerMessage: 'Network performance is restored.',
    description:
      'With H3 throttled to ≤3.00 Mbps, switch queue congestion clears. H1 bandwidth recovers to 8.12 Mbps and network latency stabilizes at 2.10 ms.',
    pipelineStage: 'NETWORK PROTECTION',
  },
  {
    step: 8,
    title: 'Step 8: Final Experimental Results',
    shortTitle: '8. Final Results',
    bannerMessage:
      'Behaviour-Driven Rogue Device Detection Successfully Identified and Mitigated Abnormal Network Behaviour.',
    description:
      'Complete end-to-end verification comparing Baseline (9.55 Mbps / 1.67 ms), Unmitigated Rogue Flood (4.62 Mbps / 18.42 ms), and Post-QoS Protection (8.12 Mbps / 2.10 ms).',
    pipelineStage: 'NETWORK PROTECTION',
  },
];

export function calculateRiskBreakdown(params: {
  id: DeviceId;
  knownIdentity: boolean;
  packetsPerSec: number;
  bandwidthMbps: number;
  protocol: 'TCP' | 'UDP' | 'ICMP' | 'HTTP/TLS';
  isFloodPattern: boolean;
  isMediumUnknown?: boolean;
}): RiskBreakdown {
  const { id, knownIdentity, packetsPerSec, bandwidthMbps, protocol, isFloodPattern, isMediumUnknown } = params;

  if (id === 'H2') {
    return {
      packetRatePoints: 2,
      bandwidthPoints: 2,
      identityPoints: 0,
      protocolPoints: 1,
      patternPoints: 0,
      total: 5,
    };
  }

  if (id === 'H1') {
    return {
      packetRatePoints: 4,
      bandwidthPoints: 4,
      identityPoints: 0,
      protocolPoints: 2,
      patternPoints: 0,
      total: 10,
    };
  }

  if (id === 'H4') {
    return {
      packetRatePoints: 4,
      bandwidthPoints: 3,
      identityPoints: 0,
      protocolPoints: 2,
      patternPoints: 3,
      total: 12,
    };
  }

  if (id === 'H5' && isMediumUnknown) {
    return {
      packetRatePoints: 8,
      bandwidthPoints: 7,
      identityPoints: 20,
      protocolPoints: 5,
      patternPoints: 5,
      total: 45,
    };
  }

  // Dynamic calculation for H3 (or custom overrides)
  const packetRatePoints = Math.min(25, Math.round((packetsPerSec / 1950) * 25));
  const bandwidthPoints = Math.min(25, Math.round((bandwidthMbps / 9.2) * 25));
  const identityPoints = knownIdentity ? 0 : 20;
  const protocolPoints = protocol === 'UDP' ? (packetsPerSec > 1200 ? 14 : packetsPerSec > 600 ? 10 : 5) : 2;
  const patternPoints = isFloodPattern ? 13 : packetsPerSec > 700 ? 9 : 3;

  const total = Math.min(
    100,
    packetRatePoints + bandwidthPoints + identityPoints + protocolPoints + patternPoints
  );

  return {
    packetRatePoints,
    bandwidthPoints,
    identityPoints,
    protocolPoints,
    patternPoints,
    total,
  };
}

export function buildDevicesForStep(
  step: SimulationStepId,
  elapsedSec: number,
  jitterSeed: number = 0
): VirtualDevice[] {
  // Small deterministic micro-jitter so live numbers breathe naturally
  const j1 = Math.sin(jitterSeed * 1.3) * 0.04;
  const j3 = Math.cos(jitterSeed * 1.7) * 0.06;
  const pJitter = Math.round(Math.sin(jitterSeed * 2.1) * 12);

  // H3 progression across steps
  let h3Pps = 180 + pJitter;
  let h3Bw = Number((0.95 + j3).toFixed(2));
  let h3Proto: 'TCP' | 'UDP' = 'TCP';
  let h3Pattern: VirtualDevice['trafficPattern'] = 'Low / Steady';
  let h3Behaviour: VirtualDevice['behaviourLabel'] = 'Normal';
  let h3TrafficLabel: VirtualDevice['trafficLevelLabel'] = 'Low';
  let h3Qos = false;
  let h3Risk: RiskBreakdown = {
    packetRatePoints: 3,
    bandwidthPoints: 3,
    identityPoints: 20,
    protocolPoints: 2,
    patternPoints: 2,
    total: 30,
  };
  let h3Status: DeviceStatus = 'Monitoring';
  let h3Action: PolicyAction = 'Monitor';
  let h3Reasons: string[] = ['Unverified MAC identity under initial baseline observation'];

  // H1 progression across steps
  let h1Bw = Number((9.55 + j1).toFixed(2));
  let h1Pps = 820 + pJitter;
  let h1Action: PolicyAction = 'Allow';
  let h1Qos = false;

  if (step === 1) {
    h1Bw = Number((2.4 + j1).toFixed(2));
    h1Pps = 240 + pJitter;
    h3Pps = 110;
    h3Bw = 0.45;
    h3Risk = {
      packetRatePoints: 2,
      bandwidthPoints: 2,
      identityPoints: 20,
      protocolPoints: 2,
      patternPoints: 2,
      total: 28,
    };
  } else if (step === 2) {
    h1Bw = Number((9.55 + j1).toFixed(2));
    h1Pps = 840 + pJitter;
    h3Pps = 195 + pJitter;
    h3Bw = Number((0.98 + j3 * 0.5).toFixed(2));
    h3Risk = {
      packetRatePoints: 4,
      bandwidthPoints: 3,
      identityPoints: 20,
      protocolPoints: 2,
      patternPoints: 3,
      total: 32,
    };
  } else if (step === 3) {
    // Abnormal Traffic Onset
    h1Bw = Number((6.85 + j1).toFixed(2));
    h1Pps = 640 + pJitter;
    h3Pps = 980 + pJitter * 2;
    h3Bw = Number((5.45 + j3).toFixed(2));
    h3Proto = 'UDP';
    h3Pattern = 'Elevated Burst';
    h3Behaviour = 'Elevating';
    h3TrafficLabel = 'High';
    h3Risk = {
      packetRatePoints: 14,
      bandwidthPoints: 15,
      identityPoints: 20,
      protocolPoints: 9,
      patternPoints: 6,
      total: 64,
    };
    h3Status = 'Suspicious';
    h3Action = 'Inspecting';
    h3Reasons = [
      'Sudden shift from TCP to high-rate UDP datagrams',
      'Bandwidth jumped from 1.0 Mbps to >5.4 Mbps',
      'Unregistered host identity (00:00:00:00:00:03)',
    ];
  } else if (step === 4) {
    // Behaviour Analysis & Risk Elevation
    h1Bw = Number((5.40 + j1).toFixed(2));
    h1Pps = 530 + pJitter;
    h3Pps = 1420 + pJitter * 2;
    h3Bw = Number((7.25 + j3).toFixed(2));
    h3Proto = 'UDP';
    h3Pattern = 'High-Volume Flood';
    h3Behaviour = 'Abnormal';
    h3TrafficLabel = 'Very High';
    h3Risk = {
      packetRatePoints: 18,
      bandwidthPoints: 19,
      identityPoints: 20,
      protocolPoints: 11,
      patternPoints: 10,
      total: 78,
    };
    h3Status = 'Suspicious';
    h3Action = 'Inspecting';
    h3Reasons = [
      'Sustained packet burst (>1,400 pkts/sec)',
      'Consuming >7.2 Mbps switch backplane capacity',
      'Abnormal UDP flood signature detected',
    ];
  } else if (step === 5) {
    // Rogue Device Detected (Exact benchmark values from specification)
    h1Bw = 4.62;
    h1Pps = 450 + pJitter;
    h3Pps = 1850;
    h3Bw = 8.7;
    h3Proto = 'UDP';
    h3Pattern = 'High-Volume Flood';
    h3Behaviour = 'Abnormal';
    h3TrafficLabel = 'Very High';
    h3Risk = {
      packetRatePoints: 23,
      bandwidthPoints: 22,
      identityPoints: 20,
      protocolPoints: 12,
      patternPoints: 10,
      total: 87,
    };
    h3Status = 'Rogue';
    h3Action = 'Inspecting';
    h3Reasons = [
      'Excessive traffic volume flooding S1 egress queue',
      'High packet rate (1,850 packets/sec)',
      'Abnormal UDP behaviour with zero handshake',
      'Unusual bandwidth consumption (8.7 Mbps)',
    ];
  } else if (step === 6) {
    // QoS Policy Activated
    h1Bw = Number((7.45 + j1).toFixed(2));
    h1Pps = 740 + pJitter;
    h1Action = 'Prioritized (≥7 Mbps)';
    h1Qos = true;

    h3Pps = 620 + pJitter;
    h3Bw = 2.95;
    h3Proto = 'UDP';
    h3Pattern = 'QoS Throttled';
    h3Behaviour = 'Abnormal';
    h3TrafficLabel = 'Restricted (≤3 Mbps)';
    h3Qos = true;
    h3Risk = {
      packetRatePoints: 23,
      bandwidthPoints: 22,
      identityPoints: 20,
      protocolPoints: 12,
      patternPoints: 10,
      total: 87,
    };
    h3Status = 'Rogue';
    h3Action = 'Rate Limited (≤3 Mbps)';
    h3Reasons = [
      'Classified as Rogue Device (Risk Score: 87/100)',
      'HTB Rate Limiter active: capped at 3.0 Mbps maximum',
      'Deprioritized to Low-Priority OpenFlow Queue Q2',
    ];
  } else if (step === 7 || step === 8) {
    // Network Performance Restored & Final Results (Exact benchmark values)
    h1Bw = 8.12;
    h1Pps = 795 + pJitter;
    h1Action = 'Prioritized (≥7 Mbps)';
    h1Qos = true;

    h3Pps = 590;
    h3Bw = 2.85;
    h3Proto = 'UDP';
    h3Pattern = 'QoS Throttled';
    h3Behaviour = 'Abnormal';
    h3TrafficLabel = 'Restricted (≤3 Mbps)';
    h3Qos = true;
    h3Risk = {
      packetRatePoints: 23,
      bandwidthPoints: 22,
      identityPoints: 20,
      protocolPoints: 12,
      patternPoints: 10,
      total: 87,
    };
    h3Status = 'Rogue';
    h3Action = 'Rate Limited (≤3 Mbps)';
    h3Reasons = [
      'Excessive traffic',
      'High packet rate',
      'Abnormal UDP behaviour',
      'Unusual bandwidth consumption',
    ];
  }

  const h2Bw = Number((h1Bw + h3Bw * 0.4 + 0.85).toFixed(2));

  return [
    {
      id: 'H1',
      name: 'H1 – Trusted High-Priority',
      roleLabel: 'Trusted High-Priority Device',
      ip: '10.0.0.1',
      mac: '00:00:00:00:00:01',
      knownIdentity: true,
      isHighPriority: true,
      packetsPerSec: Math.max(120, h1Pps),
      bandwidthMbps: h1Bw,
      trafficVolumeMB: Number((14.2 + elapsedSec * 0.85).toFixed(1)),
      protocol: 'TCP',
      connectionDurationSec: 120 + elapsedSec,
      trafficPattern: 'Normal',
      behaviourLabel: 'Normal',
      trafficLevelLabel: 'Low',
      riskBreakdown: calculateRiskBreakdown({
        id: 'H1',
        knownIdentity: true,
        packetsPerSec: h1Pps,
        bandwidthMbps: h1Bw,
        protocol: 'TCP',
        isFloodPattern: false,
      }),
      riskScore: 10,
      status: 'Trusted',
      action: h1Action,
      qosActive: h1Qos,
      reasons: ['Verified MAC & IP profile', 'Predictable TCP flow to Server H2'],
    },
    {
      id: 'H2',
      name: 'H2 – Server / Receiver',
      roleLabel: 'Server / Receiver',
      ip: '10.0.0.2',
      mac: '00:00:00:00:00:02',
      knownIdentity: true,
      isServer: true,
      packetsPerSec: Math.max(200, Math.round(h1Pps * 0.9 + h3Pps * 0.35)),
      bandwidthMbps: h2Bw,
      trafficVolumeMB: Number((28.6 + elapsedSec * 1.35).toFixed(1)),
      protocol: 'TCP',
      connectionDurationSec: 360 + elapsedSec,
      trafficPattern: 'Normal',
      behaviourLabel: 'Normal',
      trafficLevelLabel: 'Medium',
      riskBreakdown: calculateRiskBreakdown({
        id: 'H2',
        knownIdentity: true,
        packetsPerSec: 450,
        bandwidthMbps: h2Bw,
        protocol: 'TCP',
        isFloodPattern: false,
      }),
      riskScore: 5,
      status: 'Server',
      action: 'Allow',
      qosActive: false,
      reasons: ['Core destination server sink (10.0.0.2)'],
    },
    {
      id: 'H3',
      name: 'H3 – Unknown/Suspicious',
      roleLabel: 'Unknown / Dynamic Host',
      ip: '10.0.0.3',
      mac: '00:00:00:00:00:03',
      knownIdentity: false,
      packetsPerSec: h3Pps,
      bandwidthMbps: h3Bw,
      trafficVolumeMB: Number((6.4 + elapsedSec * (step >= 3 ? 2.4 : 0.3)).toFixed(1)),
      protocol: h3Proto,
      connectionDurationSec: 45 + elapsedSec,
      trafficPattern: h3Pattern,
      behaviourLabel: h3Behaviour,
      trafficLevelLabel: h3TrafficLabel,
      riskBreakdown: h3Risk,
      riskScore: h3Risk.total,
      status: h3Status,
      action: h3Action,
      qosActive: h3Qos,
      reasons: h3Reasons,
    },
    {
      id: 'H4',
      name: 'H4 – Trusted Normal Device',
      roleLabel: 'Trusted Normal Device',
      ip: '10.0.0.4',
      mac: '00:00:00:00:00:04',
      knownIdentity: true,
      packetsPerSec: Math.max(95, 145 + Math.round(pJitter * 0.4)),
      bandwidthMbps: Number((0.65 + Math.abs(j1) * 0.4).toFixed(2)),
      trafficVolumeMB: Number((4.8 + elapsedSec * 0.18).toFixed(1)),
      protocol: 'HTTP/TLS',
      connectionDurationSec: 98 + elapsedSec,
      trafficPattern: 'Low / Steady',
      behaviourLabel: 'Normal',
      trafficLevelLabel: 'Low',
      riskBreakdown: calculateRiskBreakdown({
        id: 'H4',
        knownIdentity: true,
        packetsPerSec: 145,
        bandwidthMbps: 0.65,
        protocol: 'HTTP/TLS',
        isFloodPattern: false,
      }),
      riskScore: 12,
      status: 'Trusted',
      action: 'Allow',
      qosActive: false,
      reasons: ['Authenticated workstation', 'Standard HTTP/TLS periodicity'],
    },
    {
      id: 'H5',
      name: 'H5 – New/Unknown Device',
      roleLabel: 'New / Unknown Device',
      ip: '10.0.0.5',
      mac: '00:00:00:00:00:05',
      knownIdentity: false,
      packetsPerSec: Math.max(210, 310 + Math.round(pJitter * 0.6)),
      bandwidthMbps: Number((1.45 + Math.abs(j3) * 0.3).toFixed(2)),
      trafficVolumeMB: Number((7.1 + elapsedSec * 0.32).toFixed(1)),
      protocol: 'TCP',
      connectionDurationSec: 30 + elapsedSec,
      trafficPattern: 'Medium / Periodic',
      behaviourLabel: 'Unknown',
      trafficLevelLabel: 'Medium',
      riskBreakdown: calculateRiskBreakdown({
        id: 'H5',
        knownIdentity: false,
        packetsPerSec: 310,
        bandwidthMbps: 1.45,
        protocol: 'TCP',
        isFloodPattern: false,
        isMediumUnknown: true,
      }),
      riskScore: 45,
      status: 'Monitoring',
      action: 'Monitor',
      qosActive: false,
      reasons: [
        'New MAC 00:00:00:00:00:05 joined switch S1',
        'Moderate traffic within safe limits — kept under observation',
      ],
    },
  ];
}

export function computeNetworkMetrics(
  step: SimulationStepId,
  devices: VirtualDevice[],
  timeLabel: string
): NetworkMetrics {
  const h1 = devices.find((d) => d.id === 'H1')!;
  const h3 = devices.find((d) => d.id === 'H3')!;
  const totalPacketsPerSec = devices.reduce((acc, d) => acc + d.packetsPerSec, 0);
  const trafficVolumeMB = Number(
    devices.reduce((acc, d) => acc + d.trafficVolumeMB, 0).toFixed(1)
  );

  let latencyMs = 1.67;
  let congestionPercent = 14;

  if (step === 1) {
    latencyMs = 1.45;
    congestionPercent = 10;
  } else if (step === 2) {
    latencyMs = 1.67;
    congestionPercent = 18;
  } else if (step === 3) {
    latencyMs = 8.95;
    congestionPercent = 62;
  } else if (step === 4) {
    latencyMs = 14.3;
    congestionPercent = 81;
  } else if (step === 5) {
    latencyMs = 18.42;
    congestionPercent = 94;
  } else if (step === 6) {
    latencyMs = 4.15;
    congestionPercent = 36;
  } else if (step === 7 || step === 8) {
    latencyMs = 2.1;
    congestionPercent = 24;
  }

  const totalThroughputMbps = Number(
    (h1.bandwidthMbps + h3.bandwidthMbps + 2.1).toFixed(2)
  );

  return {
    timestamp: timeLabel,
    step,
    h1BandwidthMbps: h1.bandwidthMbps,
    h3BandwidthMbps: h3.bandwidthMbps,
    totalThroughputMbps,
    latencyMs,
    totalPacketsPerSec,
    trafficVolumeMB,
    congestionPercent,
  };
}
