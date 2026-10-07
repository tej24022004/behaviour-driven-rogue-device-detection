export type DeviceId = 'H1' | 'H2' | 'H3' | 'H4' | 'H5';

export type DeviceStatus = 'Trusted' | 'Server' | 'Monitoring' | 'Suspicious' | 'Rogue';

export type PolicyAction = 'Allow' | 'Prioritized (≥7 Mbps)' | 'Monitor' | 'Inspecting' | 'Rate Limited (≤3 Mbps)';

export type SimulationStepId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export interface RiskBreakdown {
  packetRatePoints: number;     // max 25
  bandwidthPoints: number;      // max 25
  identityPoints: number;       // max 20
  protocolPoints: number;       // max 15
  patternPoints: number;        // max 15
  total: number;                // 0 - 100
}

export interface VirtualDevice {
  id: DeviceId;
  name: string;
  roleLabel: string;
  ip: string;
  mac: string;
  knownIdentity: boolean;
  isServer?: boolean;
  isHighPriority?: boolean;
  packetsPerSec: number;
  bandwidthMbps: number;
  trafficVolumeMB: number;
  protocol: 'TCP' | 'UDP' | 'ICMP' | 'HTTP/TLS';
  connectionDurationSec: number;
  trafficPattern: 'Low / Steady' | 'Normal' | 'Medium / Periodic' | 'Elevated Burst' | 'High-Volume Flood' | 'QoS Throttled';
  behaviourLabel: 'Normal' | 'Unknown' | 'Elevating' | 'Abnormal' | 'Throttled';
  trafficLevelLabel: 'Low' | 'Medium' | 'High' | 'Very High' | 'Restricted (≤3 Mbps)';
  riskBreakdown: RiskBreakdown;
  riskScore: number;
  status: DeviceStatus;
  action: PolicyAction;
  qosActive: boolean;
  reasons: string[];
}

export interface NetworkMetrics {
  timestamp: string;
  step: SimulationStepId;
  h1BandwidthMbps: number;
  h3BandwidthMbps: number;
  totalThroughputMbps: number;
  latencyMs: number;
  totalPacketsPerSec: number;
  trafficVolumeMB: number;
  congestionPercent: number;
}

export interface SecurityLogEntry {
  id: string;
  time: string;
  level: 'info' | 'warning' | 'critical' | 'qos' | 'success';
  device?: DeviceId | 'S1';
  message: string;
}

export interface StepDefinition {
  step: SimulationStepId;
  title: string;
  shortTitle: string;
  bannerMessage: string;
  description: string;
  pipelineStage:
    | 'DEVICE MONITORING'
    | 'BEHAVIOUR COLLECTION'
    | 'BEHAVIOUR ANALYSIS'
    | 'RISK EVALUATION'
    | 'ROGUE DETECTION'
    | 'QoS RESPONSE'
    | 'NETWORK PROTECTION';
}
