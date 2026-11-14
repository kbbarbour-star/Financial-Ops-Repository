import { INCIDENTS_RECORDS, INCIDENT_ACTIVITY_RECORDS } from './incidentsAndActivity';
import { KNOWLEDGE_BASE_RECORDS } from './knowledgeBase';
import { SERVICES_RECORDS } from './services';
import { SLA_DEFINITIONS } from './slaDefinitions';
import { ASSIGNMENT_GROUPS, USERS_RECORDS } from './usersAndGroups';
import type {
  AssignmentGroupRecord,
  IncidentActivityRecord,
  IncidentRecord,
  KnowledgeBaseRecord,
  ServiceRecord,
  SlaDefinitionRecord,
  TabId,
  UserRecord,
} from '../types/itsm';

export const TAB_METADATA: Record<
  TabId,
  { label: string; group: 'Operations' | 'Organization & Catalog' | 'Governance & Playbooks'; description: string; count: number }
> = {
  Incidents: {
    label: 'Incidents',
    group: 'Operations',
    description: 'Primary financial institution incident records with live 24x7 elapsed-calendar-time SLA tracking.',
    count: INCIDENTS_RECORDS.length,
  },
  IncidentActivity: {
    label: 'IncidentActivity',
    group: 'Operations',
    description: 'Chronological audit trail, state transitions, escalations, and SLA compliance events.',
    count: INCIDENT_ACTIVITY_RECORDS.length,
  },
  Services: {
    label: 'Services',
    group: 'Organization & Catalog',
    description: 'Business and technical banking services mapped to regulatory scope, RTO/RPO, and default SLAs.',
    count: SERVICES_RECORDS.length,
  },
  AssignmentGroups: {
    label: 'AssignmentGroups',
    group: 'Organization & Catalog',
    description: 'Specialized financial IT support squads, auto-routing rules, and escalation channels.',
    count: ASSIGNMENT_GROUPS.length,
  },
  Users: {
    label: 'Users',
    group: 'Organization & Catalog',
    description: 'Incident commanders, L1–L3 analysts, DBAs, and service owners across global timezones.',
    count: USERS_RECORDS.length,
  },
  SLA_Definitions: {
    label: 'SLA_Definitions',
    group: 'Governance & Playbooks',
    description: 'Elapsed calendar time (24x7) response and resolution targets across financial service tiers.',
    count: SLA_DEFINITIONS.length,
  },
  KnowledgeBase: {
    label: 'KnowledgeBase',
    group: 'Governance & Playbooks',
    description: 'Preserved ITIL v4 operational triage playbook and 56 historical incident postmortem records.',
    count: KNOWLEDGE_BASE_RECORDS.length,
  },
};

export const userById = new Map<string, UserRecord>(USERS_RECORDS.map((u) => [u.userId, u]));
export const groupById = new Map<string, AssignmentGroupRecord>(
  ASSIGNMENT_GROUPS.map((g) => [g.groupId, g])
);
export const serviceById = new Map<string, ServiceRecord>(
  SERVICES_RECORDS.map((s) => [s.serviceId, s])
);
export const slaById = new Map<string, SlaDefinitionRecord>(
  SLA_DEFINITIONS.map((sla) => [sla.slaId, sla])
);
export const incidentById = new Map<string, IncidentRecord>(
  INCIDENTS_RECORDS.map((inc) => [inc.incidentId, inc])
);
export const kbById = new Map<string, KnowledgeBaseRecord>(
  KNOWLEDGE_BASE_RECORDS.map((kb) => [kb.incidentId, kb])
);
export const activityById = new Map<string, IncidentActivityRecord>(
  INCIDENT_ACTIVITY_RECORDS.map((act) => [act.activityId, act])
);

export function getActivitiesForIncident(incidentId: string): IncidentActivityRecord[] {
  return INCIDENT_ACTIVITY_RECORDS.filter((a) => a.incidentId === incidentId).sort(
    (a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp)
  );
}

export function getIncidentsForService(serviceId: string): IncidentRecord[] {
  return INCIDENTS_RECORDS.filter((i) => i.serviceId === serviceId);
}

export function getIncidentsForGroup(groupId: string): IncidentRecord[] {
  return INCIDENTS_RECORDS.filter((i) => i.assignmentGroupId === groupId);
}

export function getIncidentsForUser(userId: string): IncidentRecord[] {
  return INCIDENTS_RECORDS.filter((i) => i.assignedToUserId === userId);
}

export function getIncidentsForSla(slaId: string): IncidentRecord[] {
  return INCIDENTS_RECORDS.filter((i) => i.slaId === slaId);
}

export function getIncidentsForKb(kbId: string): IncidentRecord[] {
  return INCIDENTS_RECORDS.filter((i) => i.kbReferenceId === kbId);
}

export function getUsersInGroup(groupId: string): UserRecord[] {
  return USERS_RECORDS.filter((u) => u.primaryGroupId === groupId);
}

export function getServicesForGroup(groupId: string): ServiceRecord[] {
  return SERVICES_RECORDS.filter((s) => s.supportGroupId === groupId);
}

export function getServicesForSla(slaId: string): ServiceRecord[] {
  return SERVICES_RECORDS.filter((s) => s.defaultSlaId === slaId);
}

export function getActivitiesByUser(userId: string): IncidentActivityRecord[] {
  return INCIDENT_ACTIVITY_RECORDS.filter((a) => a.actorUserId === userId);
}
