// Event names for SafeVoice
export const REPORT_EVENTS = {
  SUBMITTED: 'report.submitted',
  VALIDATED: 'report.validated',
  ANALYZED: 'report.analyzed',
  URGENT: 'report.urgent',
  ACCEPTED: 'report.accepted',
  RESOLVED: 'report.resolved',
} as const;

export const NOTIFICATION_EVENTS = {
  NGO_ALERT: 'notification.ngo.alert',
  VICTIM_UPDATE: 'notification.victim.update',
} as const;
