import { ASSIGNMENT_GROUPS, USERS_RECORDS } from '../data/usersAndGroups';
import { INCIDENTS_RECORDS, INCIDENT_ACTIVITY_RECORDS } from '../data/incidentsAndActivity';
import { KNOWLEDGE_BASE_RECORDS } from '../data/knowledgeBase';
import { SERVICES_RECORDS } from '../data/services';
import { SLA_DEFINITIONS } from '../data/slaDefinitions';
import { slaById } from '../data/relations';
import type { TabId } from '../types/itsm';
import { evaluateIncidentSla } from '../utils/slaEngine';

interface SummaryStripProps {
  activeTab: TabId;
  filteredCount: number;
  referenceNowMs: number;
}

interface MetricItem {
  label: string;
  value: string;
  detail: string;
  tone?: 'default' | 'danger' | 'warning' | 'success';
}

export function SummaryStrip({
  activeTab,
  filteredCount,
  referenceNowMs,
}: SummaryStripProps) {
  const metrics = buildMetricsForTab(activeTab, filteredCount, referenceNowMs);

  return (
    <section
      aria-label="Tab summary metrics"
      className="grid grid-cols-2 lg:grid-cols-4 border border-slate-200 bg-white rounded-lg divide-y lg:divide-y-0 lg:divide-x divide-slate-200"
    >
      {metrics.map((item) => {
        const valueColor =
          item.tone === 'danger'
            ? 'text-red-600'
            : item.tone === 'warning'
            ? 'text-amber-600'
            : item.tone === 'success'
            ? 'text-emerald-700'
            : 'text-slate-900';

        return (
          <div key={item.label} className="px-4 py-3">
            <div className="text-xs font-medium text-slate-500 truncate">{item.label}</div>
            <div
              className={`mt-1 font-mono text-xl font-semibold tabular-nums ${valueColor}`}
            >
              {item.value}
            </div>
            <div className="mt-0.5 text-xs text-slate-500 truncate">{item.detail}</div>
          </div>
        );
      })}
    </section>
  );
}

function buildMetricsForTab(
  tab: TabId,
  filteredCount: number,
  referenceNowMs: number
): MetricItem[] {
  switch (tab) {
    case 'Incidents': {
      const openCount = INCIDENTS_RECORDS.filter(
        (i) => i.state !== 'Resolved' && i.state !== 'Closed'
      ).length;
      const p1Count = INCIDENTS_RECORDS.filter((i) => i.priority === 'P1').length;
      let breachedCount = 0;
      let atRiskCount = 0;
      for (const inc of INCIDENTS_RECORDS) {
        const sla = slaById.get(inc.slaId);
        if (!sla) continue;
        const evalRes = evaluateIncidentSla(inc, sla, referenceNowMs);
        if (evalRes.overallStatus === 'Breached') breachedCount += 1;
        if (evalRes.overallStatus === 'At Risk') atRiskCount += 1;
      }
      return [
        {
          label: 'Incident Records',
          value: `${filteredCount} / ${INCIDENTS_RECORDS.length}`,
          detail: `${openCount} active · ${INCIDENTS_RECORDS.length - openCount} resolved or closed`,
        },
        {
          label: 'P1 Critical Incidents',
          value: String(p1Count),
          detail: 'Executive & major incident tier',
          tone: p1Count > 0 ? 'danger' : 'default',
        },
        {
          label: 'SLA Breached (24x7)',
          value: String(breachedCount),
          detail: 'Elapsed calendar time exceeded target',
          tone: breachedCount > 0 ? 'danger' : 'success',
        },
        {
          label: 'SLA At Risk',
          value: String(atRiskCount),
          detail: 'Approaching calendar threshold',
          tone: atRiskCount > 0 ? 'warning' : 'default',
        },
      ];
    }
    case 'Users': {
      const primaryOnCall = USERS_RECORDS.filter(
        (u) => u.onCallStatus === 'Primary On-Call'
      ).length;
      const l3Command = USERS_RECORDS.filter(
        (u) => u.supportTier === 'L3' || u.supportTier === 'Command'
      ).length;
      const timezones = new Set(USERS_RECORDS.map((u) => u.locationTimezone)).size;
      return [
        {
          label: 'Platform Users',
          value: `${filteredCount} / ${USERS_RECORDS.length}`,
          detail: 'Analysts, SREs & commanders',
        },
        {
          label: 'Primary On-Call',
          value: String(primaryOnCall),
          detail: 'Active 24x7 rotation coverage',
          tone: 'success',
        },
        {
          label: 'L3 & Command Tier',
          value: String(l3Command),
          detail: 'Escalation & domain specialists',
        },
        {
          label: 'Global Hubs',
          value: String(timezones),
          detail: 'Follow-the-sun timezone coverage',
        },
      ];
    }
    case 'AssignmentGroups': {
      const followSun = ASSIGNMENT_GROUPS.filter(
        (g) => g.coverageModel === '24x7 Follow-the-Sun'
      ).length;
      const p1Routing = ASSIGNMENT_GROUPS.filter(
        (g) => g.autoAssignPriority === 'P1'
      ).length;
      const totalCapacity = ASSIGNMENT_GROUPS.reduce(
        (sum, g) => sum + g.activeQueueCapacity,
        0
      );
      return [
        {
          label: 'Support Teams',
          value: `${filteredCount} / ${ASSIGNMENT_GROUPS.length}`,
          detail: 'Specialized routing squads',
        },
        {
          label: '24x7 Follow-the-Sun',
          value: String(followSun),
          detail: 'Continuous global shift handoff',
          tone: 'success',
        },
        {
          label: 'P1 Auto-Escalation',
          value: String(p1Routing),
          detail: 'Groups with P1 priority routing rules',
        },
        {
          label: 'Queue Capacity',
          value: String(totalCapacity),
          detail: 'Combined concurrent ticket threshold',
        },
      ];
    }
    case 'Services': {
      const tier0 = SERVICES_RECORDS.filter(
        (s) => s.criticalityTier === 'Tier 0 - Mission Critical'
      ).length;
      const impacted = SERVICES_RECORDS.filter(
        (s) => s.operationalStatus !== 'Operational'
      ).length;
      const bizServices = SERVICES_RECORDS.filter(
        (s) => s.serviceType === 'Business Service'
      ).length;
      return [
        {
          label: 'Financial Services',
          value: `${filteredCount} / ${SERVICES_RECORDS.length}`,
          detail: `${bizServices} business · ${SERVICES_RECORDS.length - bizServices} technical`,
        },
        {
          label: 'Tier 0 Mission Critical',
          value: String(tier0),
          detail: 'Payments, ledger, trading & security',
        },
        {
          label: 'Impacted Services',
          value: String(impacted),
          detail: 'Degraded, partial outage, or maintenance',
          tone: impacted > 0 ? 'warning' : 'success',
        },
        {
          label: 'Zero-RPO Services',
          value: String(SERVICES_RECORDS.filter((s) => s.rpoMinutes === 0).length),
          detail: 'Synchronous zero data-loss mandate',
        },
      ];
    }
    case 'SLA_Definitions': {
      const p1Slas = SLA_DEFINITIONS.filter((s) => s.priority === 'P1').length;
      const avgP1Response = Math.round(
        SLA_DEFINITIONS.filter((s) => s.priority === 'P1').reduce(
          (sum, s) => sum + s.responseTargetMinutes,
          0
        ) / Math.max(1, p1Slas)
      );
      const regulatorySlas = SLA_DEFINITIONS.filter(
        (s) => s.serviceTier === 'Regulatory / Security'
      ).length;
      return [
        {
          label: 'SLA Policies',
          value: `${filteredCount} / ${SLA_DEFINITIONS.length}`,
          detail: 'Elapsed calendar time (24x7x365)',
        },
        {
          label: 'Calculation Mode',
          value: '24x7',
          detail: 'No business-hour pauses applied',
          tone: 'success',
        },
        {
          label: 'Avg P1 Response',
          value: `${avgP1Response}m`,
          detail: `Across ${p1Slas} P1 emergency policies`,
        },
        {
          label: 'Regulatory & Sec SLAs',
          value: String(regulatorySlas),
          detail: 'FedNow, SWIFT, AML, SOX & SOC rules',
        },
      ];
    }
    case 'IncidentActivity': {
      const breaches = INCIDENT_ACTIVITY_RECORDS.filter(
        (a) => a.activityType === 'SLA Breach'
      ).length;
      const escalations = INCIDENT_ACTIVITY_RECORDS.filter(
        (a) => a.activityType === 'Escalation'
      ).length;
      const resolutions = INCIDENT_ACTIVITY_RECORDS.filter(
        (a) => a.activityType === 'Resolution'
      ).length;
      return [
        {
          label: 'Audit Entries',
          value: `${filteredCount} / ${INCIDENT_ACTIVITY_RECORDS.length}`,
          detail: 'Immutable state & assignment trail',
        },
        {
          label: 'Escalation Events',
          value: String(escalations),
          detail: 'Major incident & leadership bridges',
          tone: 'warning',
        },
        {
          label: 'SLA Breach Logs',
          value: String(breaches),
          detail: 'Calendar threshold exceedances recorded',
          tone: breaches > 0 ? 'danger' : 'default',
        },
        {
          label: 'Resolution Entries',
          value: String(resolutions),
          detail: 'Verified service recovery milestones',
          tone: 'success',
        },
      ];
    }
    case 'KnowledgeBase': {
      const p1 = KNOWLEDGE_BASE_RECORDS.filter((k) => k.priority === 'P1').length;
      const p2 = KNOWLEDGE_BASE_RECORDS.filter((k) => k.priority === 'P2').length;
      const p34 = KNOWLEDGE_BASE_RECORDS.filter(
        (k) => k.priority === 'P3' || k.priority === 'P4'
      ).length;
      return [
        {
          label: 'Historical Records',
          value: `${filteredCount} / ${KNOWLEDGE_BASE_RECORDS.length}`,
          detail: '8 domains · Preserved prototype KB',
        },
        {
          label: 'P1 Critical',
          value: String(p1),
          detail: 'Immediate executive escalation SOPs',
          tone: 'danger',
        },
        {
          label: 'P2 High',
          value: String(p2),
          detail: 'Major incident team playbooks',
          tone: 'warning',
        },
        {
          label: 'P3 / P4 Standard',
          value: String(p34),
          detail: 'Standard operational triage runbooks',
        },
      ];
    }
  }
}
