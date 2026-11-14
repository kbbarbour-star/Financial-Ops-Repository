import { ASSIGNMENT_GROUPS, USERS_RECORDS } from '../data/usersAndGroups';
import { INCIDENTS_RECORDS, INCIDENT_ACTIVITY_RECORDS } from '../data/incidentsAndActivity';
import { KNOWLEDGE_BASE_RECORDS } from '../data/knowledgeBase';
import { SERVICES_RECORDS } from '../data/services';
import { SLA_DEFINITIONS } from '../data/slaDefinitions';
import type { TabId } from '../types/itsm';
import { evaluateIncidentSla } from './slaEngine';

function escapeCsvCell(value: string | number | null | undefined): string {
  const str = value === null || value === undefined ? '' : String(value);
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toCsv(headers: string[], rows: Array<Array<string | number | null | undefined>>): string {
  const headerLine = headers.map(escapeCsvCell).join(',');
  const dataLines = rows.map((row) => row.map(escapeCsvCell).join(','));
  return [headerLine, ...dataLines].join('\r\n');
}

export function buildTabCsv(tab: TabId, referenceNowMs: number): { filename: string; content: string } {
  const slaMap = new Map(SLA_DEFINITIONS.map((s) => [s.slaId, s]));

  switch (tab) {
    case 'Incidents': {
      const headers = [
        'Incident ID',
        'Title',
        'Description',
        'Category',
        'Impact',
        'Urgency',
        'Priority',
        'State',
        'Channel',
        'Service ID',
        'Assignment Group ID',
        'Assigned To User ID',
        'SLA ID',
        'SLA Calculation Mode',
        'Computed SLA Status',
        'Elapsed Calendar Minutes',
        'KB Reference ID',
        'Created At (UTC)',
        'First Response At (UTC)',
        'Resolved At (UTC)',
        'Resolution Summary',
      ];
      const rows = INCIDENTS_RECORDS.map((inc) => {
        const sla = slaMap.get(inc.slaId);
        const evaluation = sla ? evaluateIncidentSla(inc, sla, referenceNowMs) : null;
        return [
          inc.incidentId,
          inc.title,
          inc.description,
          inc.category,
          inc.impact,
          inc.urgency,
          inc.priority,
          inc.state,
          inc.channel,
          inc.serviceId,
          inc.assignmentGroupId,
          inc.assignedToUserId,
          inc.slaId,
          sla?.calculationMode ?? 'Elapsed Calendar Time (24x7)',
          evaluation?.overallStatus ?? 'Unknown',
          evaluation ? Math.round(evaluation.resolutionElapsedMinutes) : '',
          inc.kbReferenceId,
          inc.createdAt,
          inc.firstResponseAt ?? '',
          inc.resolvedAt ?? '',
          inc.resolutionSummary,
        ];
      });
      return { filename: 'Incidents.csv', content: toCsv(headers, rows) };
    }
    case 'Users': {
      const headers = [
        'User ID',
        'Full Name',
        'Email',
        'Role Title',
        'Support Tier',
        'Primary Assignment Group ID',
        'Location / Timezone',
        'On-Call Status',
        'Employment Status',
      ];
      const rows = USERS_RECORDS.map((u) => [
        u.userId,
        u.fullName,
        u.email,
        u.roleTitle,
        u.supportTier,
        u.primaryGroupId,
        u.locationTimezone,
        u.onCallStatus,
        u.employmentStatus,
      ]);
      return { filename: 'Users.csv', content: toCsv(headers, rows) };
    }
    case 'AssignmentGroups': {
      const headers = [
        'Group ID',
        'Group Name',
        'Domain',
        'Routing Rule',
        'Auto-Assign Priority',
        'Coverage Model',
        'Escalation Channel',
        'Manager User ID',
        'Primary Service ID',
        'Active Queue Capacity',
      ];
      const rows = ASSIGNMENT_GROUPS.map((g) => [
        g.groupId,
        g.groupName,
        g.domain,
        g.routingRule,
        g.autoAssignPriority,
        g.coverageModel,
        g.escalationChannel,
        g.managerUserId,
        g.primaryServiceId,
        g.activeQueueCapacity,
      ]);
      return { filename: 'AssignmentGroups.csv', content: toCsv(headers, rows) };
    }
    case 'Services': {
      const headers = [
        'Service ID',
        'Service Name',
        'Service Type',
        'Business Line',
        'Criticality Tier',
        'Regulatory Scope',
        'Service Owner User ID',
        'Support Group ID',
        'Default SLA ID',
        'RTO (Minutes)',
        'RPO (Minutes)',
        'Operational Status',
      ];
      const rows = SERVICES_RECORDS.map((s) => [
        s.serviceId,
        s.serviceName,
        s.serviceType,
        s.businessLine,
        s.criticalityTier,
        s.regulatoryScope,
        s.serviceOwnerUserId,
        s.supportGroupId,
        s.defaultSlaId,
        s.rtoMinutes,
        s.rpoMinutes,
        s.operationalStatus,
      ]);
      return { filename: 'Services.csv', content: toCsv(headers, rows) };
    }
    case 'SLA_Definitions': {
      const headers = [
        'SLA ID',
        'SLA Name',
        'Service Tier',
        'Priority',
        'Calculation Mode',
        'Response Target (Minutes)',
        'Resolution Target (Minutes)',
        'Warning Threshold (%)',
        'Escalation Trigger',
      ];
      const rows = SLA_DEFINITIONS.map((sla) => [
        sla.slaId,
        sla.slaName,
        sla.serviceTier,
        sla.priority,
        sla.calculationMode,
        sla.responseTargetMinutes,
        sla.resolutionTargetMinutes,
        sla.warningThresholdPct,
        sla.escalationTrigger,
      ]);
      return { filename: 'SLA_Definitions.csv', content: toCsv(headers, rows) };
    }
    case 'IncidentActivity': {
      const headers = [
        'Activity ID',
        'Incident ID',
        'Timestamp (UTC)',
        'Actor User ID',
        'Activity Type',
        'Field Changed',
        'Previous Value',
        'New Value',
        'Notes',
      ];
      const rows = INCIDENT_ACTIVITY_RECORDS.map((act) => [
        act.activityId,
        act.incidentId,
        act.timestamp,
        act.actorUserId,
        act.activityType,
        act.fieldChanged,
        act.previousValue,
        act.newValue,
        act.notes,
      ]);
      return { filename: 'IncidentActivity.csv', content: toCsv(headers, rows) };
    }
    case 'KnowledgeBase': {
      const headers = [
        'Incident ID',
        'Incident Category',
        'Description',
        'Impact',
        'Urgency',
        'Priority',
        'Major Incident Criteria',
        'Escalation Procedures',
        'Communication Standards',
        'Resolution',
      ];
      const rows = KNOWLEDGE_BASE_RECORDS.map((kb) => [
        kb.incidentId,
        kb.incidentCategory,
        kb.description,
        kb.impact,
        kb.urgency,
        kb.priority,
        kb.majorIncidentCriteria,
        kb.escalationProcedures,
        kb.communicationStandards,
        kb.resolution,
      ]);
      return { filename: 'KnowledgeBase.csv', content: toCsv(headers, rows) };
    }
  }
}

export function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadActiveTabCsv(tab: TabId, referenceNowMs: number): string {
  const { filename, content } = buildTabCsv(tab, referenceNowMs);
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  triggerBlobDownload(blob, filename);
  return filename;
}

const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = (c & 1) !== 0 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc = CRC32_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

export function downloadAllTabsZip(referenceNowMs: number): string {
  const tabs: TabId[] = [
    'Incidents',
    'Users',
    'AssignmentGroups',
    'Services',
    'SLA_Definitions',
    'IncidentActivity',
    'KnowledgeBase',
  ];

  const encoder = new TextEncoder();
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  for (const tab of tabs) {
    const { filename, content } = buildTabCsv(tab, referenceNowMs);
    const nameBytes = encoder.encode(filename);
    const dataBytes = encoder.encode(content);
    const checksum = crc32(dataBytes);

    const localHeader = new Uint8Array(30 + nameBytes.length);
    const lv = new DataView(localHeader.buffer);
    lv.setUint32(0, 0x04034b50, true);
    lv.setUint16(4, 20, true);
    lv.setUint16(6, 0x0800, true);
    lv.setUint16(8, 0, true);
    lv.setUint16(10, 0, true);
    lv.setUint16(12, 0x5421, true);
    lv.setUint32(14, checksum, true);
    lv.setUint32(18, dataBytes.length, true);
    lv.setUint32(22, dataBytes.length, true);
    lv.setUint16(26, nameBytes.length, true);
    lv.setUint16(28, 0, true);
    localHeader.set(nameBytes, 30);

    const centralHeader = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(centralHeader.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true);
    cv.setUint16(6, 20, true);
    cv.setUint16(8, 0x0800, true);
    cv.setUint16(10, 0, true);
    cv.setUint16(12, 0, true);
    cv.setUint16(14, 0x5421, true);
    cv.setUint32(16, checksum, true);
    cv.setUint32(20, dataBytes.length, true);
    cv.setUint32(24, dataBytes.length, true);
    cv.setUint16(28, nameBytes.length, true);
    cv.setUint16(30, 0, true);
    cv.setUint16(32, 0, true);
    cv.setUint16(34, 0, true);
    cv.setUint16(36, 0, true);
    cv.setUint32(38, 0, true);
    cv.setUint32(42, offset, true);
    centralHeader.set(nameBytes, 46);

    localParts.push(localHeader, dataBytes);
    centralParts.push(centralHeader);
    offset += localHeader.length + dataBytes.length;
  }

  const centralSize = centralParts.reduce((acc, part) => acc + part.length, 0);
  const endRecord = new Uint8Array(22);
  const ev = new DataView(endRecord.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(4, 0, true);
  ev.setUint16(6, 0, true);
  ev.setUint16(8, tabs.length, true);
  ev.setUint16(10, tabs.length, true);
  ev.setUint32(12, centralSize, true);
  ev.setUint32(16, offset, true);
  ev.setUint16(20, 0, true);

  const allParts = [...localParts, ...centralParts, endRecord];
  const totalBytes = allParts.reduce((acc, part) => acc + part.length, 0);
  const archiveBuffer = new ArrayBuffer(totalBytes);
  const archiveView = new Uint8Array(archiveBuffer);
  let cursor = 0;
  for (const part of allParts) {
    archiveView.set(part, cursor);
    cursor += part.length;
  }

  const blob = new Blob([archiveBuffer], {
    type: 'application/zip',
  });
  const archiveName = 'Meridian_Financial_ITSM_7Tabs.zip';
  triggerBlobDownload(blob, archiveName);
  return archiveName;
}
