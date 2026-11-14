import { ArrowDown, ArrowUp, ArrowUpDown, RotateCcw } from 'lucide-react';
import type { ReactNode } from 'react';
import {
  groupById,
  incidentById,
  kbById,
  serviceById,
  slaById,
  userById,
} from '../data/relations';
import type {
  AssignmentGroupRecord,
  DrawerSelection,
  IncidentActivityRecord,
  IncidentRecord,
  KnowledgeBaseRecord,
  PriorityLevel,
  ServiceRecord,
  SlaComplianceStatus,
  SlaDefinitionRecord,
  TabId,
  UserRecord,
} from '../types/itsm';
import {
  evaluateIncidentSla,
  formatIsoShort,
  formatMinutesDuration,
} from '../utils/slaEngine';

export interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

interface ColumnDef<T> {
  key: string;
  label: string;
  align?: 'left' | 'right';
  widthClass?: string;
  sortValue?: (row: T) => string | number;
  render: (row: T) => ReactNode;
}

interface DataGridProps {
  activeTab: TabId;
  rows: unknown[];
  sortConfig: SortConfig | null;
  onSort: (key: string) => void;
  onSelectRow: (selection: DrawerSelection) => void;
  onResetFilters: () => void;
  referenceNowMs: number;
}

function PriorityText({ priority }: { priority: PriorityLevel }) {
  const color =
    priority === 'P1'
      ? 'text-red-700 font-semibold'
      : priority === 'P2'
      ? 'text-amber-700 font-semibold'
      : priority === 'P3'
      ? 'text-blue-700 font-medium'
      : 'text-slate-600 font-medium';
  return <span className={`font-mono text-xs tabular-nums ${color}`}>{priority}</span>;
}

function SlaStatusText({ status }: { status: SlaComplianceStatus }) {
  const color =
    status === 'Breached'
      ? 'text-red-700 font-semibold'
      : status === 'At Risk'
      ? 'text-amber-700 font-semibold'
      : status === 'Met'
      ? 'text-emerald-700 font-medium'
      : 'text-emerald-700 font-medium';
  return <span className={`text-xs whitespace-nowrap ${color}`}>{status}</span>;
}

function LinkButton({
  id,
  label,
  onClick,
}: {
  id: string;
  label?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      title={label ? `${id} — ${label}` : id}
      className="font-mono text-xs text-blue-700 hover:text-blue-900 hover:underline focus-visible:outline-2 focus-visible:outline-blue-700 whitespace-nowrap"
    >
      {id}
    </button>
  );
}

export function DataGrid({
  activeTab,
  rows,
  sortConfig,
  onSort,
  onSelectRow,
  onResetFilters,
  referenceNowMs,
}: DataGridProps) {
  const columns = getColumnsForTab(activeTab, onSelectRow, referenceNowMs);

  const sortedRows = [...rows];
  if (sortConfig) {
    const col = columns.find((c) => c.key === sortConfig.key);
    if (col?.sortValue) {
      const extractor = col.sortValue;
      sortedRows.sort((a, b) => {
        const va = extractor(a as never);
        const vb = extractor(b as never);
        if (typeof va === 'number' && typeof vb === 'number') {
          return sortConfig.direction === 'asc' ? va - vb : vb - va;
        }
        return sortConfig.direction === 'asc'
          ? String(va).localeCompare(String(vb))
          : String(vb).localeCompare(String(va));
      });
    }
  }

  if (sortedRows.length === 0) {
    return (
      <div className="border border-slate-200 bg-white rounded-lg px-6 py-16 text-center">
        <div className="font-display text-base font-semibold text-slate-900">
          No matching records in {activeTab}
        </div>
        <p className="mt-1.5 text-sm text-slate-600 max-w-md mx-auto">
          Adjust your search query or clear the active priority, state, or cross-tab filters to inspect all records.
        </p>
        <button
          type="button"
          onClick={onResetFilters}
          className="mt-5 inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-md hover:bg-slate-800 transition-colors whitespace-nowrap"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Clear Filters
        </button>
      </div>
    );
  }

  return (
    <div className="border border-slate-200 bg-white rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {columns.map((col) => {
                const isSorted = sortConfig?.key === col.key;
                const alignClass = col.align === 'right' ? 'text-right' : 'text-left';
                return (
                  <th
                    key={col.key}
                    scope="col"
                    className={`px-3.5 py-2.5 text-xs font-semibold text-slate-600 whitespace-nowrap select-none ${alignClass} ${
                      col.widthClass ?? ''
                    }`}
                  >
                    {col.sortValue ? (
                      <button
                        type="button"
                        onClick={() => onSort(col.key)}
                        className={`inline-flex items-center gap-1 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-blue-700 ${
                          col.align === 'right' ? 'flex-row-reverse' : ''
                        }`}
                      >
                        <span>{col.label}</span>
                        {isSorted ? (
                          sortConfig.direction === 'asc' ? (
                            <ArrowUp className="h-3 w-3 text-blue-700" />
                          ) : (
                            <ArrowDown className="h-3 w-3 text-blue-700" />
                          )
                        ) : (
                          <ArrowUpDown className="h-3 w-3 text-slate-400" />
                        )}
                      </button>
                    ) : (
                      col.label
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-[13px] text-slate-700">
            {sortedRows.map((row) => {
              const rowSelection = getRowSelection(activeTab, row);
              return (
                <tr
                  key={rowSelection.id}
                  onClick={() => onSelectRow(rowSelection)}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectRow(rowSelection);
                    }
                  }}
                  className="h-10 hover:bg-slate-50/90 cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-blue-700"
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-3.5 py-2 align-middle ${
                        col.align === 'right' ? 'text-right' : 'text-left'
                      } ${col.widthClass ?? ''}`}
                    >
                      {col.render(row as never)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function getRowSelection(tab: TabId, row: unknown): DrawerSelection {
  switch (tab) {
    case 'Incidents':
      return { tab, id: (row as IncidentRecord).incidentId };
    case 'Users':
      return { tab, id: (row as UserRecord).userId };
    case 'AssignmentGroups':
      return { tab, id: (row as AssignmentGroupRecord).groupId };
    case 'Services':
      return { tab, id: (row as ServiceRecord).serviceId };
    case 'SLA_Definitions':
      return { tab, id: (row as SlaDefinitionRecord).slaId };
    case 'IncidentActivity':
      return { tab, id: (row as IncidentActivityRecord).activityId };
    case 'KnowledgeBase':
      return { tab, id: (row as KnowledgeBaseRecord).incidentId };
  }
}

function getColumnsForTab(
  tab: TabId,
  onSelectRow: (sel: DrawerSelection) => void,
  referenceNowMs: number
): ColumnDef<never>[] {
  switch (tab) {
    case 'Incidents': {
      const cols: ColumnDef<IncidentRecord>[] = [
        {
          key: 'incidentId',
          label: 'Incident ID',
          sortValue: (r) => r.incidentId,
          render: (r) => (
            <span className="font-mono text-xs font-semibold text-slate-900 whitespace-nowrap">
              {r.incidentId}
            </span>
          ),
        },
        {
          key: 'priority',
          label: 'Priority',
          sortValue: (r) => r.priority,
          render: (r) => <PriorityText priority={r.priority} />,
        },
        {
          key: 'state',
          label: 'State',
          sortValue: (r) => r.state,
          render: (r) => {
            const cls =
              r.state === 'Escalated'
                ? 'text-red-700 font-semibold'
                : r.state === 'Open' || r.state === 'In Progress'
                ? 'text-blue-700 font-medium'
                : 'text-slate-600';
            return <span className={`whitespace-nowrap ${cls}`}>{r.state}</span>;
          },
        },
        {
          key: 'title',
          label: 'Incident Summary & Category',
          widthClass: 'min-w-[280px] max-w-[360px]',
          sortValue: (r) => r.title,
          render: (r) => (
            <div className="truncate">
              <span className="font-medium text-slate-900">{r.title}</span>
              <span className="text-slate-400"> · </span>
              <span className="text-xs text-slate-500">{r.category}</span>
            </div>
          ),
        },
        {
          key: 'serviceId',
          label: 'Service',
          sortValue: (r) => r.serviceId,
          render: (r) => {
            const svc = serviceById.get(r.serviceId);
            return (
              <div className="flex items-center gap-1.5 whitespace-nowrap">
                <LinkButton
                  id={r.serviceId}
                  label={svc?.serviceName}
                  onClick={() => onSelectRow({ tab: 'Services', id: r.serviceId })}
                />
                {svc && (
                  <span className="text-xs text-slate-500 truncate max-w-[140px]">
                    {svc.serviceName}
                  </span>
                )}
              </div>
            );
          },
        },
        {
          key: 'assignmentGroupId',
          label: 'Group',
          sortValue: (r) => r.assignmentGroupId,
          render: (r) => (
            <LinkButton
              id={r.assignmentGroupId}
              label={groupById.get(r.assignmentGroupId)?.groupName}
              onClick={() =>
                onSelectRow({ tab: 'AssignmentGroups', id: r.assignmentGroupId })
              }
            />
          ),
        },
        {
          key: 'assignedToUserId',
          label: 'Assignee',
          sortValue: (r) => userById.get(r.assignedToUserId)?.fullName ?? r.assignedToUserId,
          render: (r) => {
            const usr = userById.get(r.assignedToUserId);
            return (
              <div className="flex items-center gap-1.5 whitespace-nowrap">
                <LinkButton
                  id={r.assignedToUserId}
                  label={usr?.fullName}
                  onClick={() => onSelectRow({ tab: 'Users', id: r.assignedToUserId })}
                />
                {usr && <span className="text-xs text-slate-600">{usr.fullName}</span>}
              </div>
            );
          },
        },
        {
          key: 'slaStatus',
          label: 'SLA (24x7 Elapsed)',
          sortValue: (r) => {
            const sla = slaById.get(r.slaId);
            return sla ? evaluateIncidentSla(r, sla, referenceNowMs).resolutionPct : 0;
          },
          render: (r) => {
            const sla = slaById.get(r.slaId);
            if (!sla) return <span className="text-slate-400">N/A</span>;
            const ev = evaluateIncidentSla(r, sla, referenceNowMs);
            return (
              <div className="flex items-center gap-2 whitespace-nowrap">
                <SlaStatusText status={ev.overallStatus} />
                <span className="text-slate-400">·</span>
                <span className="font-mono text-xs text-slate-600 tabular-nums">
                  {formatMinutesDuration(ev.resolutionElapsedMinutes)} /{' '}
                  {formatMinutesDuration(ev.resolutionTargetMinutes)}
                </span>
              </div>
            );
          },
        },
        {
          key: 'kbReferenceId',
          label: 'KB Ref',
          sortValue: (r) => r.kbReferenceId,
          render: (r) => (
            <LinkButton
              id={r.kbReferenceId}
              label={kbById.get(r.kbReferenceId)?.incidentCategory}
              onClick={() => onSelectRow({ tab: 'KnowledgeBase', id: r.kbReferenceId })}
            />
          ),
        },
      ];
      return cols as ColumnDef<never>[];
    }

    case 'Users': {
      const cols: ColumnDef<UserRecord>[] = [
        {
          key: 'userId',
          label: 'User ID',
          sortValue: (r) => r.userId,
          render: (r) => (
            <span className="font-mono text-xs font-semibold text-slate-900 whitespace-nowrap">
              {r.userId}
            </span>
          ),
        },
        {
          key: 'fullName',
          label: 'Name & Email',
          sortValue: (r) => r.fullName,
          render: (r) => (
            <div className="whitespace-nowrap">
              <span className="font-medium text-slate-900">{r.fullName}</span>
              <span className="text-slate-400"> · </span>
              <span className="text-xs text-slate-500">{r.email}</span>
            </div>
          ),
        },
        {
          key: 'roleTitle',
          label: 'Role Title',
          sortValue: (r) => r.roleTitle,
          render: (r) => <span className="text-slate-800 whitespace-nowrap">{r.roleTitle}</span>,
        },
        {
          key: 'supportTier',
          label: 'Tier',
          sortValue: (r) => r.supportTier,
          render: (r) => (
            <span className="font-mono text-xs font-medium text-slate-700 whitespace-nowrap">
              {r.supportTier}
            </span>
          ),
        },
        {
          key: 'primaryGroupId',
          label: 'Primary Group',
          sortValue: (r) => r.primaryGroupId,
          render: (r) => {
            const grp = groupById.get(r.primaryGroupId);
            return (
              <div className="flex items-center gap-1.5 whitespace-nowrap">
                <LinkButton
                  id={r.primaryGroupId}
                  label={grp?.groupName}
                  onClick={() =>
                    onSelectRow({ tab: 'AssignmentGroups', id: r.primaryGroupId })
                  }
                />
                {grp && (
                  <span className="text-xs text-slate-500 truncate max-w-[160px]">
                    {grp.groupName}
                  </span>
                )}
              </div>
            );
          },
        },
        {
          key: 'onCallStatus',
          label: 'On-Call Status',
          sortValue: (r) => r.onCallStatus,
          render: (r) => (
            <span
              className={`text-xs whitespace-nowrap ${
                r.onCallStatus === 'Primary On-Call'
                  ? 'text-emerald-700 font-semibold'
                  : r.onCallStatus === 'Secondary On-Call'
                  ? 'text-blue-700 font-medium'
                  : 'text-slate-600'
              }`}
            >
              {r.onCallStatus}
            </span>
          ),
        },
        {
          key: 'locationTimezone',
          label: 'Location / TZ',
          sortValue: (r) => r.locationTimezone,
          render: (r) => (
            <span className="text-xs text-slate-600 whitespace-nowrap">
              {r.locationTimezone}
            </span>
          ),
        },
      ];
      return cols as ColumnDef<never>[];
    }

    case 'AssignmentGroups': {
      const cols: ColumnDef<AssignmentGroupRecord>[] = [
        {
          key: 'groupId',
          label: 'Group ID',
          sortValue: (r) => r.groupId,
          render: (r) => (
            <span className="font-mono text-xs font-semibold text-slate-900 whitespace-nowrap">
              {r.groupId}
            </span>
          ),
        },
        {
          key: 'groupName',
          label: 'Group Name & Domain',
          sortValue: (r) => r.groupName,
          render: (r) => (
            <div className="whitespace-nowrap">
              <span className="font-medium text-slate-900">{r.groupName}</span>
              <span className="text-slate-400"> · </span>
              <span className="text-xs text-slate-500">{r.domain}</span>
            </div>
          ),
        },
        {
          key: 'routingRule',
          label: 'Routing Rule',
          widthClass: 'min-w-[260px] max-w-[340px]',
          render: (r) => (
            <div className="truncate text-xs text-slate-600" title={r.routingRule}>
              {r.routingRule}
            </div>
          ),
        },
        {
          key: 'autoAssignPriority',
          label: 'Auto-Route',
          sortValue: (r) => r.autoAssignPriority,
          render: (r) => (
            <span className="font-mono text-xs text-slate-700 whitespace-nowrap">
              {r.autoAssignPriority}
            </span>
          ),
        },
        {
          key: 'coverageModel',
          label: 'Coverage',
          sortValue: (r) => r.coverageModel,
          render: (r) => (
            <span className="text-xs text-slate-700 whitespace-nowrap">{r.coverageModel}</span>
          ),
        },
        {
          key: 'managerUserId',
          label: 'Lead',
          sortValue: (r) => userById.get(r.managerUserId)?.fullName ?? r.managerUserId,
          render: (r) => {
            const mgr = userById.get(r.managerUserId);
            return (
              <div className="flex items-center gap-1.5 whitespace-nowrap">
                <LinkButton
                  id={r.managerUserId}
                  label={mgr?.fullName}
                  onClick={() => onSelectRow({ tab: 'Users', id: r.managerUserId })}
                />
                {mgr && <span className="text-xs text-slate-600">{mgr.fullName}</span>}
              </div>
            );
          },
        },
        {
          key: 'primaryServiceId',
          label: 'Primary Service',
          sortValue: (r) => r.primaryServiceId,
          render: (r) => (
            <LinkButton
              id={r.primaryServiceId}
              label={serviceById.get(r.primaryServiceId)?.serviceName}
              onClick={() => onSelectRow({ tab: 'Services', id: r.primaryServiceId })}
            />
          ),
        },
        {
          key: 'activeQueueCapacity',
          label: 'Capacity',
          align: 'right',
          sortValue: (r) => r.activeQueueCapacity,
          render: (r) => (
            <span className="font-mono text-xs tabular-nums text-slate-700">
              {r.activeQueueCapacity}
            </span>
          ),
        },
      ];
      return cols as ColumnDef<never>[];
    }

    case 'Services': {
      const cols: ColumnDef<ServiceRecord>[] = [
        {
          key: 'serviceId',
          label: 'Service ID',
          sortValue: (r) => r.serviceId,
          render: (r) => (
            <span className="font-mono text-xs font-semibold text-slate-900 whitespace-nowrap">
              {r.serviceId}
            </span>
          ),
        },
        {
          key: 'serviceName',
          label: 'Service Name & Line',
          widthClass: 'min-w-[260px]',
          sortValue: (r) => r.serviceName,
          render: (r) => (
            <div className="truncate">
              <span className="font-medium text-slate-900">{r.serviceName}</span>
              <span className="text-slate-400"> · </span>
              <span className="text-xs text-slate-500">{r.businessLine}</span>
            </div>
          ),
        },
        {
          key: 'criticalityTier',
          label: 'Tier',
          sortValue: (r) => r.criticalityTier,
          render: (r) => (
            <span className="text-xs font-medium text-slate-700 whitespace-nowrap">
              {r.criticalityTier.split(' - ')[0]}
            </span>
          ),
        },
        {
          key: 'operationalStatus',
          label: 'Status',
          sortValue: (r) => r.operationalStatus,
          render: (r) => {
            const cls =
              r.operationalStatus === 'Partial Outage'
                ? 'text-red-700 font-semibold'
                : r.operationalStatus === 'Degraded Performance'
                ? 'text-amber-700 font-semibold'
                : r.operationalStatus === 'Under Maintenance'
                ? 'text-blue-700 font-medium'
                : 'text-emerald-700 font-medium';
            return <span className={`text-xs whitespace-nowrap ${cls}`}>{r.operationalStatus}</span>;
          },
        },
        {
          key: 'regulatoryScope',
          label: 'Regulatory Scope',
          render: (r) => (
            <span className="text-xs text-slate-600 whitespace-nowrap">
              {r.regulatoryScope}
            </span>
          ),
        },
        {
          key: 'supportGroupId',
          label: 'Support Group',
          sortValue: (r) => r.supportGroupId,
          render: (r) => (
            <LinkButton
              id={r.supportGroupId}
              label={groupById.get(r.supportGroupId)?.groupName}
              onClick={() => onSelectRow({ tab: 'AssignmentGroups', id: r.supportGroupId })}
            />
          ),
        },
        {
          key: 'defaultSlaId',
          label: 'Default SLA',
          sortValue: (r) => r.defaultSlaId,
          render: (r) => (
            <LinkButton
              id={r.defaultSlaId}
              label={slaById.get(r.defaultSlaId)?.slaName}
              onClick={() => onSelectRow({ tab: 'SLA_Definitions', id: r.defaultSlaId })}
            />
          ),
        },
        {
          key: 'rtoMinutes',
          label: 'RTO / RPO',
          align: 'right',
          sortValue: (r) => r.rtoMinutes,
          render: (r) => (
            <span className="font-mono text-xs tabular-nums text-slate-700 whitespace-nowrap">
              {r.rtoMinutes}m / {r.rpoMinutes}m
            </span>
          ),
        },
      ];
      return cols as ColumnDef<never>[];
    }

    case 'SLA_Definitions': {
      const cols: ColumnDef<SlaDefinitionRecord>[] = [
        {
          key: 'slaId',
          label: 'SLA ID',
          sortValue: (r) => r.slaId,
          render: (r) => (
            <span className="font-mono text-xs font-semibold text-slate-900 whitespace-nowrap">
              {r.slaId}
            </span>
          ),
        },
        {
          key: 'slaName',
          label: 'Policy Name',
          sortValue: (r) => r.slaName,
          render: (r) => (
            <span className="font-medium text-slate-900 whitespace-nowrap">{r.slaName}</span>
          ),
        },
        {
          key: 'priority',
          label: 'Priority',
          sortValue: (r) => r.priority,
          render: (r) => <PriorityText priority={r.priority} />,
        },
        {
          key: 'serviceTier',
          label: 'Service Tier',
          sortValue: (r) => r.serviceTier,
          render: (r) => (
            <span className="text-xs text-slate-600 whitespace-nowrap">{r.serviceTier}</span>
          ),
        },
        {
          key: 'calculationMode',
          label: 'Clock Mode',
          render: (r) => (
            <span className="text-xs font-medium text-slate-700 whitespace-nowrap">
              {r.calculationMode}
            </span>
          ),
        },
        {
          key: 'responseTargetMinutes',
          label: 'Response Target',
          align: 'right',
          sortValue: (r) => r.responseTargetMinutes,
          render: (r) => (
            <span className="font-mono text-xs tabular-nums text-slate-900 whitespace-nowrap">
              {formatMinutesDuration(r.responseTargetMinutes)} ({r.responseTargetMinutes}m)
            </span>
          ),
        },
        {
          key: 'resolutionTargetMinutes',
          label: 'Resolution Target',
          align: 'right',
          sortValue: (r) => r.resolutionTargetMinutes,
          render: (r) => (
            <span className="font-mono text-xs tabular-nums text-slate-900 whitespace-nowrap">
              {formatMinutesDuration(r.resolutionTargetMinutes)} ({r.resolutionTargetMinutes}m)
            </span>
          ),
        },
        {
          key: 'warningThresholdPct',
          label: 'Warn %',
          align: 'right',
          sortValue: (r) => r.warningThresholdPct,
          render: (r) => (
            <span className="font-mono text-xs tabular-nums text-slate-600">
              {r.warningThresholdPct}%
            </span>
          ),
        },
      ];
      return cols as ColumnDef<never>[];
    }

    case 'IncidentActivity': {
      const cols: ColumnDef<IncidentActivityRecord>[] = [
        {
          key: 'activityId',
          label: 'Activity ID',
          sortValue: (r) => r.activityId,
          render: (r) => (
            <span className="font-mono text-xs font-semibold text-slate-900 whitespace-nowrap">
              {r.activityId}
            </span>
          ),
        },
        {
          key: 'incidentId',
          label: 'Incident ID',
          sortValue: (r) => r.incidentId,
          render: (r) => (
            <LinkButton
              id={r.incidentId}
              label={incidentById.get(r.incidentId)?.title}
              onClick={() => onSelectRow({ tab: 'Incidents', id: r.incidentId })}
            />
          ),
        },
        {
          key: 'timestamp',
          label: 'Timestamp',
          sortValue: (r) => Date.parse(r.timestamp),
          render: (r) => (
            <span className="font-mono text-xs tabular-nums text-slate-600 whitespace-nowrap">
              {formatIsoShort(r.timestamp)}
            </span>
          ),
        },
        {
          key: 'activityType',
          label: 'Event Type',
          sortValue: (r) => r.activityType,
          render: (r) => {
            const cls =
              r.activityType === 'SLA Breach'
                ? 'text-red-700 font-semibold'
                : r.activityType === 'Escalation'
                ? 'text-amber-700 font-semibold'
                : r.activityType === 'Resolution'
                ? 'text-emerald-700 font-medium'
                : 'text-slate-800 font-medium';
            return <span className={`text-xs whitespace-nowrap ${cls}`}>{r.activityType}</span>;
          },
        },
        {
          key: 'actorUserId',
          label: 'Actor',
          sortValue: (r) => userById.get(r.actorUserId)?.fullName ?? r.actorUserId,
          render: (r) => {
            const actor = userById.get(r.actorUserId);
            return (
              <div className="flex items-center gap-1.5 whitespace-nowrap">
                <LinkButton
                  id={r.actorUserId}
                  label={actor?.fullName}
                  onClick={() => onSelectRow({ tab: 'Users', id: r.actorUserId })}
                />
                {actor && <span className="text-xs text-slate-600">{actor.fullName}</span>}
              </div>
            );
          },
        },
        {
          key: 'fieldChanged',
          label: 'Transition',
          render: (r) => (
            <div className="whitespace-nowrap text-xs">
              <span className="font-medium text-slate-700">{r.fieldChanged}:</span>{' '}
              <span className="text-slate-500">{r.previousValue}</span>{' '}
              <span className="text-slate-400">→</span>{' '}
              <span className="text-slate-900 font-medium">{r.newValue}</span>
            </div>
          ),
        },
        {
          key: 'notes',
          label: 'Audit Notes',
          widthClass: 'min-w-[260px] max-w-[360px]',
          render: (r) => (
            <div className="truncate text-xs text-slate-600" title={r.notes}>
              {r.notes}
            </div>
          ),
        },
      ];
      return cols as ColumnDef<never>[];
    }

    case 'KnowledgeBase': {
      const cols: ColumnDef<KnowledgeBaseRecord>[] = [
        {
          key: 'incidentId',
          label: 'KB ID',
          sortValue: (r) => r.incidentId,
          render: (r) => (
            <span className="font-mono text-xs font-semibold text-slate-900 whitespace-nowrap">
              {r.incidentId}
            </span>
          ),
        },
        {
          key: 'incidentCategory',
          label: 'Category',
          sortValue: (r) => r.incidentCategory,
          render: (r) => (
            <span className="text-xs font-medium text-slate-800 whitespace-nowrap">
              {r.incidentCategory}
            </span>
          ),
        },
        {
          key: 'priority',
          label: 'Priority',
          sortValue: (r) => r.priority,
          render: (r) => <PriorityText priority={r.priority} />,
        },
        {
          key: 'impactUrgency',
          label: 'Impact / Urgency',
          render: (r) => (
            <span className="text-xs text-slate-600 whitespace-nowrap">
              {r.impact} · {r.urgency}
            </span>
          ),
        },
        {
          key: 'description',
          label: 'Historical Incident Description',
          widthClass: 'min-w-[280px] max-w-[380px]',
          render: (r) => (
            <div className="truncate text-slate-800" title={r.description}>
              {r.description}
            </div>
          ),
        },
        {
          key: 'escalationProcedures',
          label: 'Escalation SOP',
          widthClass: 'min-w-[220px] max-w-[300px]',
          render: (r) => (
            <div className="truncate text-xs text-slate-600" title={r.escalationProcedures}>
              {r.escalationProcedures}
            </div>
          ),
        },
        {
          key: 'resolution',
          label: 'Documented Resolution',
          widthClass: 'min-w-[240px] max-w-[320px]',
          render: (r) => (
            <div className="truncate text-xs text-slate-600" title={r.resolution}>
              {r.resolution}
            </div>
          ),
        },
      ];
      return cols as ColumnDef<never>[];
    }
  }
}
