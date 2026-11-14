export type TabId =
  | 'Incidents'
  | 'Users'
  | 'AssignmentGroups'
  | 'Services'
  | 'SLA_Definitions'
  | 'IncidentActivity'
  | 'KnowledgeBase';

export type PriorityLevel = 'P1' | 'P2' | 'P3' | 'P4';
export type ImpactUrgencyLevel = 'High' | 'Medium' | 'Low';
export type IncidentState = 'Open' | 'In Progress' | 'Escalated' | 'Resolved' | 'Closed';

export interface IncidentRecord {
  incidentId: string;
  title: string;
  description: string;
  category: string;
  impact: ImpactUrgencyLevel;
  urgency: ImpactUrgencyLevel;
  priority: PriorityLevel;
  state: IncidentState;
  channel: 'Monitoring Alert' | 'Trading Desk Hotline' | 'Service Portal' | 'SOC Detection' | 'Regulatory Feed';
  serviceId: string;
  assignmentGroupId: string;
  assignedToUserId: string;
  slaId: string;
  kbReferenceId: string;
  createdAt: string;
  firstResponseAt: string | null;
  resolvedAt: string | null;
  resolutionSummary: string;
}

export interface UserRecord {
  userId: string;
  fullName: string;
  email: string;
  roleTitle: string;
  supportTier: 'L1' | 'L2' | 'L3' | 'Command' | 'Executive';
  primaryGroupId: string;
  locationTimezone: string;
  onCallStatus: 'Primary On-Call' | 'Secondary On-Call' | 'Business Hours' | 'Off Shift';
  employmentStatus: 'Active' | 'Active - Delegated';
}

export interface AssignmentGroupRecord {
  groupId: string;
  groupName: string;
  domain: string;
  routingRule: string;
  autoAssignPriority: PriorityLevel | 'All Priorities';
  coverageModel: '24x7 Follow-the-Sun' | '24x7 On-Call' | 'Extended Market Hours' | 'Business Hours + P1 Page';
  escalationChannel: string;
  managerUserId: string;
  primaryServiceId: string;
  activeQueueCapacity: number;
}

export interface ServiceRecord {
  serviceId: string;
  serviceName: string;
  serviceType: 'Business Service' | 'Technical Service';
  businessLine:
    | 'Retail & Digital Banking'
    | 'Payments & Clearing'
    | 'Capital Markets & Trading'
    | 'Risk, Fraud & Compliance'
    | 'Wealth & Commercial'
    | 'Core Infrastructure & Security';
  criticalityTier: 'Tier 0 - Mission Critical' | 'Tier 1 - High Criticality' | 'Tier 2 - Business Essential' | 'Tier 3 - Operational';
  regulatoryScope: string;
  serviceOwnerUserId: string;
  supportGroupId: string;
  defaultSlaId: string;
  rtoMinutes: number;
  rpoMinutes: number;
  operationalStatus: 'Operational' | 'Degraded Performance' | 'Partial Outage' | 'Under Maintenance';
}

export interface SlaDefinitionRecord {
  slaId: string;
  slaName: string;
  serviceTier: 'Tier 0 - Mission Critical' | 'Tier 1 - High Criticality' | 'Tier 2 - Business Essential' | 'Tier 3 - Operational' | 'Regulatory / Security';
  priority: PriorityLevel;
  calculationMode: 'Elapsed Calendar Time (24x7)';
  responseTargetMinutes: number;
  resolutionTargetMinutes: number;
  warningThresholdPct: number;
  escalationTrigger: string;
}

export interface IncidentActivityRecord {
  activityId: string;
  incidentId: string;
  timestamp: string;
  actorUserId: string;
  activityType:
    | 'Created'
    | 'State Change'
    | 'Assignment'
    | 'Escalation'
    | 'SLA Breach'
    | 'Workaround'
    | 'Resolution'
    | 'Audit Note';
  fieldChanged: string;
  previousValue: string;
  newValue: string;
  notes: string;
}

export interface KnowledgeBaseRecord {
  incidentId: string;
  incidentCategory: string;
  description: string;
  impact: ImpactUrgencyLevel;
  urgency: ImpactUrgencyLevel;
  priority: PriorityLevel;
  majorIncidentCriteria: string;
  escalationProcedures: string;
  communicationStandards: string;
  resolution: string;
}

export type SlaComplianceStatus = 'Within Target' | 'At Risk' | 'Breached' | 'Met';

export interface SlaEvaluation {
  sla: SlaDefinitionRecord;
  isClosedOrResolved: boolean;
  responseElapsedMinutes: number;
  responseTargetMinutes: number;
  responsePct: number;
  responseStatus: SlaComplianceStatus;
  resolutionElapsedMinutes: number;
  resolutionTargetMinutes: number;
  resolutionPct: number;
  resolutionStatus: SlaComplianceStatus;
  overallStatus: SlaComplianceStatus;
  remainingOrOverdueMinutes: number;
}

export type DrawerSelection =
  | { tab: 'Incidents'; id: string }
  | { tab: 'Users'; id: string }
  | { tab: 'AssignmentGroups'; id: string }
  | { tab: 'Services'; id: string }
  | { tab: 'SLA_Definitions'; id: string }
  | { tab: 'IncidentActivity'; id: string }
  | { tab: 'KnowledgeBase'; id: string };
