// Event payload interfaces
export interface ReportSubmittedEvent {
  reportId: string;
  description: string;
  incidentType: string;
  location: string;
}

export interface ReportAnalyzedEvent {
  reportId: string;
  urgency: 'critical' | 'high' | 'medium' | 'low';
  classification: string;
  immediateDanger: boolean;
}

export interface ReportUrgentEvent {
  reportId: string;
  urgency: 'critical' | 'high';
  classification: string;
  location: string;
}
