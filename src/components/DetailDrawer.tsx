import {
  ArrowLeft,
  ArrowUpRight,
  Clock,
  ExternalLink,
  X,
} from 'lucide-react';
import type { ReactNode } from 'react';
import {
  activityById,
  getActivitiesByUser,
  getActivitiesForIncident,
  getIncidentsForGroup,
  getIncidentsForKb,
  getIncidentsForService,
  getIncidentsForSla,
  getIncidentsForUser,
  getServicesForGroup,
  getServicesForSla,
  getUsersInGroup,
  groupById,
  incidentById,
  kbById,
  serviceById,
  slaById,
  userById,
} from '../data/relations';
import type { DrawerSelection, TabId } from '../types/itsm';
import {
  evaluateIncidentSla,
  formatIsoShort,
  formatMinutesDuration,
} from '../utils/slaEngine';

interface DetailDrawerProps {
  stack: DrawerSelection[];
  onPush: (selection: DrawerSelection) => void;
  onPop: () => void;
  onClose: () => void;
  onJumpToTabFilter: (tab: TabId, query: string) => void;
  referenceNowMs: number;
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="pt-5 mt-5 border-t border-slate-200">
      <h3 className="text-xs font-semibold text-slate-500 mb-3">{title}</h3>
      {children}
    </div>
  );
}

function FieldRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-3 py-1.5 text-[13px]">
      <div className="text-slate-500 col-span-1">{label}</div>
      <div className="text-slate-900 col-span-2 break-words">{value}</div>
    </div>
  );
}

function RelationRowButton({
  id,
  title,
  meta,
  onClick,
}: {
  id: string;
  title: string;
  meta?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center justify-between gap-3 px-3 py-2 text-left rounded-md border border-slate-200 bg-slate-50/70 hover:bg-slate-100 hover:border-slate-300 transition-colors"
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-semibold text-blue-700 shrink-0">
            {id}
          </span>
          <span className="text-[13px] font-medium text-slate-900 truncate">{title}</span>
        </div>
        {meta && <div className="mt-0.5 text-xs text-slate-500 truncate">{meta}</div>}
      </div>
      <ArrowUpRight className="h-4 w-4 text-slate-400 shrink-0" />
    </button>
  );
}

export function DetailDrawer({
  stack,
  onPush,
  onPop,
  onClose,
  onJumpToTabFilter,
  referenceNowMs,
}: DetailDrawerProps) {
  if (stack.length === 0) return null;
  const current = stack[stack.length - 1];

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-label={`${current.tab} record details`}
    >
      <div
        className="fixed inset-0 bg-slate-900/25"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative z-10 w-full max-w-xl bg-white h-full border-l border-slate-200 flex flex-col">
        <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-slate-200 bg-slate-50/70">
          <div className="flex items-center gap-2 min-w-0">
            {stack.length > 1 && (
              <button
                type="button"
                onClick={onPop}
                aria-label="Back to previous record"
                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded hover:bg-slate-100 whitespace-nowrap shrink-0"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back
              </button>
            )}
            <span className="text-xs font-medium text-slate-500 truncate">
              {current.tab}
            </span>
            <span className="text-slate-300">/</span>
            <span className="font-mono text-xs font-semibold text-slate-900 truncate">
              {current.id}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                onJumpToTabFilter(current.tab, current.id);
                onClose();
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-blue-700 hover:bg-blue-50 rounded whitespace-nowrap"
            >
              <span>Filter in Tab</span>
              <ExternalLink className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close detail drawer"
              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-200/70 rounded"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {renderSelectionBody(current, onPush, onJumpToTabFilter, onClose, referenceNowMs)}
        </div>
      </div>
    </div>
  );
}

function renderSelectionBody(
  selection: DrawerSelection,
  onPush: (sel: DrawerSelection) => void,
  onJumpToTabFilter: (tab: TabId, query: string) => void,
  onClose: () => void,
  referenceNowMs: number
) {
  switch (selection.tab) {
    case 'Incidents': {
      const inc = incidentById.get(selection.id);
      if (!inc) return <p className="text-sm text-slate-500">Record not found.</p>;
      const svc = serviceById.get(inc.serviceId);
      const grp = groupById.get(inc.assignmentGroupId);
      const usr = userById.get(inc.assignedToUserId);
      const sla = slaById.get(inc.slaId);
      const kb = kbById.get(inc.kbReferenceId);
      const activities = getActivitiesForIncident(inc.incidentId);
      const evalRes = sla ? evaluateIncidentSla(inc, sla, referenceNowMs) : null;

      return (
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="font-mono font-semibold text-slate-900">{inc.incidentId}</span>
            <span>·</span>
            <span
              className={
                inc.priority === 'P1'
                  ? 'font-mono font-semibold text-red-700'
                  : inc.priority === 'P2'
                  ? 'font-mono font-semibold text-amber-700'
                  : 'font-mono font-medium text-slate-700'
              }
            >
              {inc.priority}
            </span>
            <span>·</span>
            <span className="font-medium text-slate-800">{inc.state}</span>
            <span>·</span>
            <span>{inc.category}</span>
          </div>
          <h2 className="mt-1.5 font-display text-lg font-semibold text-slate-900 leading-snug">
            {inc.title}
          </h2>
          <p className="mt-2.5 text-[13px] leading-relaxed text-slate-700">
            {inc.description}
          </p>

          {evalRes && (
            <Section title="Elapsed Calendar Time SLA (24x7x365)">
              <div className="p-3.5 rounded-md border border-slate-200 bg-slate-50/70 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="inline-flex items-center gap-1.5 font-medium text-slate-700">
                    <Clock className="h-3.5 w-3.5 text-slate-500" />
                    Overall Compliance:
                    <span
                      className={
                        evalRes.overallStatus === 'Breached'
                          ? 'font-semibold text-red-700'
                          : evalRes.overallStatus === 'At Risk'
                          ? 'font-semibold text-amber-700'
                          : 'font-semibold text-emerald-700'
                      }
                    >
                      {evalRes.overallStatus}
                    </span>
                  </span>
                  <span className="font-mono text-slate-600 tabular-nums">
                    {evalRes.isClosedOrResolved
                      ? 'Finalized'
                      : evalRes.remainingOrOverdueMinutes >= 0
                      ? `${formatMinutesDuration(evalRes.remainingOrOverdueMinutes)} left`
                      : `${formatMinutesDuration(evalRes.remainingOrOverdueMinutes)} overdue`}
                  </span>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-600">
                      First Response ({evalRes.responseStatus})
                    </span>
                    <span className="font-mono tabular-nums text-slate-800">
                      {formatMinutesDuration(evalRes.responseElapsedMinutes)} /{' '}
                      {formatMinutesDuration(evalRes.responseTargetMinutes)} (
                      {Math.round(evalRes.responsePct)}%)
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        evalRes.responseStatus === 'Breached'
                          ? 'bg-red-600'
                          : evalRes.responseStatus === 'At Risk'
                          ? 'bg-amber-500'
                          : 'bg-emerald-600'
                      }`}
                      style={{ width: `${Math.min(100, evalRes.responsePct)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-600">
                      Resolution ({evalRes.resolutionStatus})
                    </span>
                    <span className="font-mono tabular-nums text-slate-800">
                      {formatMinutesDuration(evalRes.resolutionElapsedMinutes)} /{' '}
                      {formatMinutesDuration(evalRes.resolutionTargetMinutes)} (
                      {Math.round(evalRes.resolutionPct)}%)
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        evalRes.resolutionStatus === 'Breached'
                          ? 'bg-red-600'
                          : evalRes.resolutionStatus === 'At Risk'
                          ? 'bg-amber-500'
                          : 'bg-emerald-600'
                      }`}
                      style={{ width: `${Math.min(100, evalRes.resolutionPct)}%` }}
                    />
                  </div>
                </div>

                <div className="text-xs text-slate-500">
                  Policy: {evalRes.sla.slaName} · {evalRes.sla.calculationMode}
                </div>
              </div>
            </Section>
          )}

          <Section title="Operational Details">
            <FieldRow label="Impact / Urgency" value={`${inc.impact} / ${inc.urgency}`} />
            <FieldRow label="Detection Channel" value={inc.channel} />
            <FieldRow
              label="Created At"
              value={
                <span className="font-mono text-xs tabular-nums">
                  {formatIsoShort(inc.createdAt)}
                </span>
              }
            />
            <FieldRow
              label="First Response At"
              value={
                <span className="font-mono text-xs tabular-nums">
                  {formatIsoShort(inc.firstResponseAt)}
                </span>
              }
            />
            <FieldRow
              label="Resolved At"
              value={
                <span className="font-mono text-xs tabular-nums">
                  {formatIsoShort(inc.resolvedAt)}
                </span>
              }
            />
            <FieldRow label="Resolution Notes" value={inc.resolutionSummary} />
          </Section>

          <Section title="Linked Entities">
            <div className="space-y-2">
              {svc && (
                <RelationRowButton
                  id={svc.serviceId}
                  title={svc.serviceName}
                  meta={`${svc.businessLine} · ${svc.criticalityTier}`}
                  onClick={() => onPush({ tab: 'Services', id: svc.serviceId })}
                />
              )}
              {grp && (
                <RelationRowButton
                  id={grp.groupId}
                  title={grp.groupName}
                  meta={`${grp.coverageModel} · ${grp.escalationChannel}`}
                  onClick={() => onPush({ tab: 'AssignmentGroups', id: grp.groupId })}
                />
              )}
              {usr && (
                <RelationRowButton
                  id={usr.userId}
                  title={usr.fullName}
                  meta={`${usr.roleTitle} · ${usr.onCallStatus}`}
                  onClick={() => onPush({ tab: 'Users', id: usr.userId })}
                />
              )}
              {sla && (
                <RelationRowButton
                  id={sla.slaId}
                  title={sla.slaName}
                  meta={`Resp ${sla.responseTargetMinutes}m · Res ${sla.resolutionTargetMinutes}m (${sla.calculationMode})`}
                  onClick={() => onPush({ tab: 'SLA_Definitions', id: sla.slaId })}
                />
              )}
              {kb && (
                <RelationRowButton
                  id={kb.incidentId}
                  title={`KB Playbook: ${kb.incidentCategory} (${kb.priority})`}
                  meta={kb.description}
                  onClick={() => onPush({ tab: 'KnowledgeBase', id: kb.incidentId })}
                />
              )}
            </div>
          </Section>

          <Section title={`Incident Activity Audit Trail (${activities.length})`}>
            {activities.length === 0 ? (
              <p className="text-xs text-slate-500">
                No audit trail entries recorded for this incident yet.
              </p>
            ) : (
              <div className="space-y-2">
                {activities.map((act) => {
                  const actor = userById.get(act.actorUserId);
                  return (
                    <RelationRowButton
                      key={act.activityId}
                      id={act.activityId}
                      title={`${act.activityType}: ${act.fieldChanged} (${act.previousValue} → ${act.newValue})`}
                      meta={`${formatIsoShort(act.timestamp)} · ${
                        actor ? actor.fullName : act.actorUserId
                      } · ${act.notes}`}
                      onClick={() =>
                        onPush({ tab: 'IncidentActivity', id: act.activityId })
                      }
                    />
                  );
                })}
              </div>
            )}
          </Section>
        </div>
      );
    }

    case 'Services': {
      const svc = serviceById.get(selection.id);
      if (!svc) return <p className="text-sm text-slate-500">Service not found.</p>;
      const owner = userById.get(svc.serviceOwnerUserId);
      const grp = groupById.get(svc.supportGroupId);
      const sla = slaById.get(svc.defaultSlaId);
      const incidents = getIncidentsForService(svc.serviceId);

      return (
        <div>
          <div className="text-xs text-slate-500">
            <span className="font-mono font-semibold text-slate-900">{svc.serviceId}</span>
            <span> · </span>
            <span>{svc.serviceType}</span>
            <span> · </span>
            <span className="font-medium text-slate-800">{svc.operationalStatus}</span>
          </div>
          <h2 className="mt-1.5 font-display text-lg font-semibold text-slate-900">
            {svc.serviceName}
          </h2>

          <Section title="Service Governance & Recovery Targets">
            <FieldRow label="Business Line" value={svc.businessLine} />
            <FieldRow label="Criticality Tier" value={svc.criticalityTier} />
            <FieldRow label="Regulatory Scope" value={svc.regulatoryScope} />
            <FieldRow
              label="RTO / RPO"
              value={
                <span className="font-mono text-xs tabular-nums">
                  {svc.rtoMinutes} min RTO · {svc.rpoMinutes} min RPO
                </span>
              }
            />
          </Section>

          <Section title="Ownership & Default SLA">
            <div className="space-y-2">
              {owner && (
                <RelationRowButton
                  id={owner.userId}
                  title={owner.fullName}
                  meta={`Service Owner · ${owner.roleTitle}`}
                  onClick={() => onPush({ tab: 'Users', id: owner.userId })}
                />
              )}
              {grp && (
                <RelationRowButton
                  id={grp.groupId}
                  title={grp.groupName}
                  meta={`Support Group · ${grp.coverageModel}`}
                  onClick={() => onPush({ tab: 'AssignmentGroups', id: grp.groupId })}
                />
              )}
              {sla && (
                <RelationRowButton
                  id={sla.slaId}
                  title={sla.slaName}
                  meta={`Default SLA · ${sla.responseTargetMinutes}m / ${sla.resolutionTargetMinutes}m`}
                  onClick={() => onPush({ tab: 'SLA_Definitions', id: sla.slaId })}
                />
              )}
            </div>
          </Section>

          <Section title={`Related Incidents (${incidents.length})`}>
            <div className="space-y-2">
              {incidents.map((inc) => (
                <RelationRowButton
                  key={inc.incidentId}
                  id={inc.incidentId}
                  title={inc.title}
                  meta={`${inc.priority} · ${inc.state} · ${formatIsoShort(inc.createdAt)}`}
                  onClick={() => onPush({ tab: 'Incidents', id: inc.incidentId })}
                />
              ))}
              {incidents.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    onJumpToTabFilter('Incidents', svc.serviceId);
                    onClose();
                  }}
                  className="mt-2 text-xs font-medium text-blue-700 hover:underline"
                >
                  Open Incidents tab filtered to {svc.serviceId}
                </button>
              )}
            </div>
          </Section>
        </div>
      );
    }

    case 'AssignmentGroups': {
      const grp = groupById.get(selection.id);
      if (!grp) return <p className="text-sm text-slate-500">Group not found.</p>;
      const mgr = userById.get(grp.managerUserId);
      const primarySvc = serviceById.get(grp.primaryServiceId);
      const members = getUsersInGroup(grp.groupId);
      const services = getServicesForGroup(grp.groupId);
      const incidents = getIncidentsForGroup(grp.groupId);

      return (
        <div>
          <div className="text-xs text-slate-500">
            <span className="font-mono font-semibold text-slate-900">{grp.groupId}</span>
            <span> · </span>
            <span>{grp.domain}</span>
            <span> · </span>
            <span>{grp.coverageModel}</span>
          </div>
          <h2 className="mt-1.5 font-display text-lg font-semibold text-slate-900">
            {grp.groupName}
          </h2>

          <Section title="Routing & Escalation Configuration">
            <FieldRow label="Routing Rule" value={grp.routingRule} />
            <FieldRow label="Auto-Assign Priority" value={grp.autoAssignPriority} />
            <FieldRow label="Escalation Channel" value={grp.escalationChannel} />
            <FieldRow
              label="Queue Capacity"
              value={
                <span className="font-mono text-xs tabular-nums">
                  {grp.activeQueueCapacity} concurrent tickets
                </span>
              }
            />
          </Section>

          <Section title="Leadership & Primary Service">
            <div className="space-y-2">
              {mgr && (
                <RelationRowButton
                  id={mgr.userId}
                  title={mgr.fullName}
                  meta={`Group Manager · ${mgr.roleTitle}`}
                  onClick={() => onPush({ tab: 'Users', id: mgr.userId })}
                />
              )}
              {primarySvc && (
                <RelationRowButton
                  id={primarySvc.serviceId}
                  title={primarySvc.serviceName}
                  meta={`Primary Service · ${primarySvc.criticalityTier}`}
                  onClick={() => onPush({ tab: 'Services', id: primarySvc.serviceId })}
                />
              )}
            </div>
          </Section>

          <Section title={`Group Members (${members.length})`}>
            <div className="space-y-2">
              {members.map((u) => (
                <RelationRowButton
                  key={u.userId}
                  id={u.userId}
                  title={u.fullName}
                  meta={`${u.roleTitle} · ${u.onCallStatus}`}
                  onClick={() => onPush({ tab: 'Users', id: u.userId })}
                />
              ))}
            </div>
          </Section>

          <Section title={`Supported Services (${services.length})`}>
            <div className="space-y-2">
              {services.map((s) => (
                <RelationRowButton
                  key={s.serviceId}
                  id={s.serviceId}
                  title={s.serviceName}
                  meta={`${s.operationalStatus} · ${s.criticalityTier}`}
                  onClick={() => onPush({ tab: 'Services', id: s.serviceId })}
                />
              ))}
            </div>
          </Section>

          <Section title={`Assigned Incidents (${incidents.length})`}>
            <div className="space-y-2">
              {incidents.map((inc) => (
                <RelationRowButton
                  key={inc.incidentId}
                  id={inc.incidentId}
                  title={inc.title}
                  meta={`${inc.priority} · ${inc.state}`}
                  onClick={() => onPush({ tab: 'Incidents', id: inc.incidentId })}
                />
              ))}
            </div>
          </Section>
        </div>
      );
    }

    case 'Users': {
      const usr = userById.get(selection.id);
      if (!usr) return <p className="text-sm text-slate-500">User not found.</p>;
      const grp = groupById.get(usr.primaryGroupId);
      const assignedIncidents = getIncidentsForUser(usr.userId);
      const activities = getActivitiesByUser(usr.userId);

      return (
        <div>
          <div className="text-xs text-slate-500">
            <span className="font-mono font-semibold text-slate-900">{usr.userId}</span>
            <span> · </span>
            <span>Tier {usr.supportTier}</span>
            <span> · </span>
            <span>{usr.onCallStatus}</span>
          </div>
          <h2 className="mt-1.5 font-display text-lg font-semibold text-slate-900">
            {usr.fullName}
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">{usr.roleTitle}</p>

          <Section title="Profile & Shift Availability">
            <FieldRow label="Email" value={usr.email} />
            <FieldRow label="Location / Timezone" value={usr.locationTimezone} />
            <FieldRow label="Employment Status" value={usr.employmentStatus} />
          </Section>

          {grp && (
            <Section title="Primary Assignment Group">
              <RelationRowButton
                id={grp.groupId}
                title={grp.groupName}
                meta={`${grp.domain} · ${grp.coverageModel}`}
                onClick={() => onPush({ tab: 'AssignmentGroups', id: grp.groupId })}
              />
            </Section>
          )}

          <Section title={`Assigned Incidents (${assignedIncidents.length})`}>
            {assignedIncidents.length === 0 ? (
              <p className="text-xs text-slate-500">No active or historical incidents assigned.</p>
            ) : (
              <div className="space-y-2">
                {assignedIncidents.map((inc) => (
                  <RelationRowButton
                    key={inc.incidentId}
                    id={inc.incidentId}
                    title={inc.title}
                    meta={`${inc.priority} · ${inc.state}`}
                    onClick={() => onPush({ tab: 'Incidents', id: inc.incidentId })}
                  />
                ))}
              </div>
            )}
          </Section>

          <Section title={`Audit Activity Actions (${activities.length})`}>
            {activities.length === 0 ? (
              <p className="text-xs text-slate-500">No activity entries logged by this user.</p>
            ) : (
              <div className="space-y-2">
                {activities.map((act) => (
                  <RelationRowButton
                    key={act.activityId}
                    id={act.activityId}
                    title={`${act.activityType} on ${act.incidentId}`}
                    meta={`${formatIsoShort(act.timestamp)} · ${act.notes}`}
                    onClick={() =>
                      onPush({ tab: 'IncidentActivity', id: act.activityId })
                    }
                  />
                ))}
              </div>
            )}
          </Section>
        </div>
      );
    }

    case 'SLA_Definitions': {
      const sla = slaById.get(selection.id);
      if (!sla) return <p className="text-sm text-slate-500">SLA policy not found.</p>;
      const services = getServicesForSla(sla.slaId);
      const incidents = getIncidentsForSla(sla.slaId);

      return (
        <div>
          <div className="text-xs text-slate-500">
            <span className="font-mono font-semibold text-slate-900">{sla.slaId}</span>
            <span> · </span>
            <span>{sla.priority}</span>
            <span> · </span>
            <span>{sla.calculationMode}</span>
          </div>
          <h2 className="mt-1.5 font-display text-lg font-semibold text-slate-900">
            {sla.slaName}
          </h2>

          <Section title="Calendar Target Parameters (24x7x365)">
            <FieldRow label="Service Tier" value={sla.serviceTier} />
            <FieldRow label="Calculation Mode" value={sla.calculationMode} />
            <FieldRow
              label="Response Target"
              value={
                <span className="font-mono text-xs tabular-nums">
                  {formatMinutesDuration(sla.responseTargetMinutes)} ({sla.responseTargetMinutes} min)
                </span>
              }
            />
            <FieldRow
              label="Resolution Target"
              value={
                <span className="font-mono text-xs tabular-nums">
                  {formatMinutesDuration(sla.resolutionTargetMinutes)} ({sla.resolutionTargetMinutes} min)
                </span>
              }
            />
            <FieldRow
              label="Warning Threshold"
              value={
                <span className="font-mono text-xs tabular-nums">
                  {sla.warningThresholdPct}% elapsed
                </span>
              }
            />
            <FieldRow label="Escalation Trigger" value={sla.escalationTrigger} />
          </Section>

          <Section title={`Services Using Default Policy (${services.length})`}>
            {services.length === 0 ? (
              <p className="text-xs text-slate-500">Applied dynamically by incident priority.</p>
            ) : (
              <div className="space-y-2">
                {services.map((s) => (
                  <RelationRowButton
                    key={s.serviceId}
                    id={s.serviceId}
                    title={s.serviceName}
                    meta={`${s.businessLine} · ${s.criticalityTier}`}
                    onClick={() => onPush({ tab: 'Services', id: s.serviceId })}
                  />
                ))}
              </div>
            )}
          </Section>

          <Section title={`Bound Incidents (${incidents.length})`}>
            {incidents.length === 0 ? (
              <p className="text-xs text-slate-500">No current incidents bound to this policy.</p>
            ) : (
              <div className="space-y-2">
                {incidents.map((inc) => (
                  <RelationRowButton
                    key={inc.incidentId}
                    id={inc.incidentId}
                    title={inc.title}
                    meta={`${inc.priority} · ${inc.state}`}
                    onClick={() => onPush({ tab: 'Incidents', id: inc.incidentId })}
                  />
                ))}
              </div>
            )}
          </Section>
        </div>
      );
    }

    case 'IncidentActivity': {
      const act = activityById.get(selection.id);
      if (!act) return <p className="text-sm text-slate-500">Activity record not found.</p>;
      const inc = incidentById.get(act.incidentId);
      const actor = userById.get(act.actorUserId);

      return (
        <div>
          <div className="text-xs text-slate-500">
            <span className="font-mono font-semibold text-slate-900">{act.activityId}</span>
            <span> · </span>
            <span className="font-medium text-slate-800">{act.activityType}</span>
            <span> · </span>
            <span className="font-mono tabular-nums">{formatIsoShort(act.timestamp)}</span>
          </div>
          <h2 className="mt-1.5 font-display text-lg font-semibold text-slate-900">
            {act.fieldChanged}: {act.previousValue} → {act.newValue}
          </h2>
          <p className="mt-2.5 text-[13px] leading-relaxed text-slate-700">{act.notes}</p>

          <Section title="Audit References">
            <div className="space-y-2">
              {inc && (
                <RelationRowButton
                  id={inc.incidentId}
                  title={inc.title}
                  meta={`${inc.priority} · ${inc.state}`}
                  onClick={() => onPush({ tab: 'Incidents', id: inc.incidentId })}
                />
              )}
              {actor && (
                <RelationRowButton
                  id={actor.userId}
                  title={actor.fullName}
                  meta={`${actor.roleTitle} · ${actor.locationTimezone}`}
                  onClick={() => onPush({ tab: 'Users', id: actor.userId })}
                />
              )}
            </div>
          </Section>
        </div>
      );
    }

    case 'KnowledgeBase': {
      const kb = kbById.get(selection.id);
      if (!kb) return <p className="text-sm text-slate-500">Knowledge Base record not found.</p>;
      const linkedIncidents = getIncidentsForKb(kb.incidentId);

      return (
        <div>
          <div className="text-xs text-slate-500">
            <span className="font-mono font-semibold text-slate-900">{kb.incidentId}</span>
            <span> · </span>
            <span>{kb.incidentCategory}</span>
            <span> · </span>
            <span className="font-mono font-semibold text-slate-800">{kb.priority}</span>
            <span> · </span>
            <span>
              Impact: {kb.impact} / Urgency: {kb.urgency}
            </span>
          </div>
          <h2 className="mt-1.5 font-display text-lg font-semibold text-slate-900 leading-snug">
            Historical Playbook &amp; Triage SOP
          </h2>
          <p className="mt-2.5 text-[13px] leading-relaxed text-slate-800">
            {kb.description}
          </p>

          <Section title="ITIL v4 Playbook Standards">
            <FieldRow label="Major Incident Criteria" value={kb.majorIncidentCriteria} />
            <FieldRow label="Escalation Procedures" value={kb.escalationProcedures} />
            <FieldRow label="Communication Standards" value={kb.communicationStandards} />
            <FieldRow label="Documented Resolution" value={kb.resolution} />
          </Section>

          <Section title={`Financial Incidents Referencing This Playbook (${linkedIncidents.length})`}>
            {linkedIncidents.length === 0 ? (
              <p className="text-xs text-slate-500">
                No active or recent financial incidents linked to this SOP.
              </p>
            ) : (
              <div className="space-y-2">
                {linkedIncidents.map((inc) => (
                  <RelationRowButton
                    key={inc.incidentId}
                    id={inc.incidentId}
                    title={inc.title}
                    meta={`${inc.priority} · ${inc.state}`}
                    onClick={() => onPush({ tab: 'Incidents', id: inc.incidentId })}
                  />
                ))}
              </div>
            )}
          </Section>
        </div>
      );
    }
  }
}
