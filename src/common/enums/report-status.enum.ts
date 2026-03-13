export enum ReportStatus {
  SUBMITTED = 'submitted',
  UNDER_REVIEW = 'under_review',
  ACTIVE = 'active',
  ON_HOLD = 'on_hold',
  RESOLVED = 'resolved',
  REFERRED = 'referred',
  CLOSED = 'closed',
  PENDING_REVIEW = 'pending_review',
  SPAM = 'spam',
}

/** Valid transitions enforced by state machine */
const TRANSITIONS: Record<string, Record<string, ReportStatus>> = {
  [ReportStatus.SUBMITTED]: {
    REVIEW: ReportStatus.UNDER_REVIEW,
    REFER: ReportStatus.REFERRED,
  },
  [ReportStatus.UNDER_REVIEW]: {
    ACCEPT: ReportStatus.ACTIVE,
    REFER: ReportStatus.REFERRED,
    CLOSE: ReportStatus.CLOSED,
  },
  [ReportStatus.ACTIVE]: {
    PUT_ON_HOLD: ReportStatus.ON_HOLD,
    RESOLVE: ReportStatus.RESOLVED,
    REFER: ReportStatus.REFERRED,
    CLOSE: ReportStatus.CLOSED,
  },
  [ReportStatus.ON_HOLD]: {
    RESUME: ReportStatus.ACTIVE,
    CLOSE: ReportStatus.CLOSED,
  },
  [ReportStatus.CLOSED]: {
    REOPEN: ReportStatus.ACTIVE,
  },
};

export function getValidTransitions(status: string): string[] {
  return Object.keys(TRANSITIONS[status] || {});
}

export function getNextStatus(currentStatus: string, event: string): ReportStatus | null {
  return TRANSITIONS[currentStatus]?.[event] || null;
}

export function isValidTransition(currentStatus: string, event: string): boolean {
  return !!TRANSITIONS[currentStatus]?.[event];
}

export const EVENTS_REQUIRING_REASON = ['PUT_ON_HOLD', 'REFER', 'CLOSE'];
