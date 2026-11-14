import type {
  IncidentRecord,
  SlaComplianceStatus,
  SlaDefinitionRecord,
  SlaEvaluation,
} from '../types/itsm';

export function evaluateIncidentSla(
  incident: IncidentRecord,
  sla: SlaDefinitionRecord,
  referenceNowMs: number
): SlaEvaluation {
  const createdMs = Date.parse(incident.createdAt);
  const endMs = incident.resolvedAt ? Date.parse(incident.resolvedAt) : referenceNowMs;
  const isClosedOrResolved = incident.state === 'Resolved' || incident.state === 'Closed';

  const responseEndMs = incident.firstResponseAt
    ? Date.parse(incident.firstResponseAt)
    : endMs;

  const responseElapsedMinutes = Math.max(0, (responseEndMs - createdMs) / 60000);
  const resolutionElapsedMinutes = Math.max(0, (endMs - createdMs) / 60000);

  const responsePct =
    sla.responseTargetMinutes > 0
      ? (responseElapsedMinutes / sla.responseTargetMinutes) * 100
      : 0;
  const resolutionPct =
    sla.resolutionTargetMinutes > 0
      ? (resolutionElapsedMinutes / sla.resolutionTargetMinutes) * 100
      : 0;

  let responseStatus: SlaComplianceStatus;
  if (incident.firstResponseAt) {
    responseStatus =
      responseElapsedMinutes > sla.responseTargetMinutes ? 'Breached' : 'Met';
  } else if (responseElapsedMinutes > sla.responseTargetMinutes) {
    responseStatus = 'Breached';
  } else if (responsePct >= sla.warningThresholdPct) {
    responseStatus = 'At Risk';
  } else {
    responseStatus = 'Within Target';
  }

  let resolutionStatus: SlaComplianceStatus;
  if (isClosedOrResolved && incident.resolvedAt) {
    resolutionStatus =
      resolutionElapsedMinutes > sla.resolutionTargetMinutes ? 'Breached' : 'Met';
  } else if (resolutionElapsedMinutes > sla.resolutionTargetMinutes) {
    resolutionStatus = 'Breached';
  } else if (resolutionPct >= sla.warningThresholdPct) {
    resolutionStatus = 'At Risk';
  } else {
    resolutionStatus = 'Within Target';
  }

  let overallStatus: SlaComplianceStatus;
  if (responseStatus === 'Breached' || resolutionStatus === 'Breached') {
    overallStatus = 'Breached';
  } else if (isClosedOrResolved) {
    overallStatus = 'Met';
  } else if (responseStatus === 'At Risk' || resolutionStatus === 'At Risk') {
    overallStatus = 'At Risk';
  } else {
    overallStatus = 'Within Target';
  }

  const remainingOrOverdueMinutes = sla.resolutionTargetMinutes - resolutionElapsedMinutes;

  return {
    sla,
    isClosedOrResolved,
    responseElapsedMinutes,
    responseTargetMinutes: sla.responseTargetMinutes,
    responsePct,
    responseStatus,
    resolutionElapsedMinutes,
    resolutionTargetMinutes: sla.resolutionTargetMinutes,
    resolutionPct,
    resolutionStatus,
    overallStatus,
    remainingOrOverdueMinutes,
  };
}

export function formatMinutesDuration(minutesValue: number): string {
  const absMins = Math.abs(minutesValue);
  if (absMins < 1) {
    const secs = Math.round(absMins * 60);
    return `${secs}s`;
  }
  if (absMins < 60) {
    return `${Math.round(absMins)}m`;
  }
  const hours = Math.floor(absMins / 60);
  const remMins = Math.round(absMins % 60);
  if (hours < 24) {
    return remMins > 0 ? `${hours}h ${remMins}m` : `${hours}h`;
  }
  const days = Math.floor(hours / 24);
  const remHours = hours % 24;
  return remHours > 0 ? `${days}d ${remHours}h` : `${days}d`;
}

export function formatIsoShort(isoString: string | null): string {
  if (!isoString) return 'Pending';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return isoString;
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  const hh = String(date.getUTCHours()).padStart(2, '0');
  const min = String(date.getUTCMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${min} UTC`;
}
