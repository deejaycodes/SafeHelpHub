import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { ReportStatus } from 'src/common/enums/report-status.enum';
import { NigerianStates } from 'src/common/enums/nigeria-states.enum';
import { encrypt, decrypt } from 'src/common/utils/encryption';

@Entity('reports')
export class Report {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Incident type ID', type: String })
  @Column()
  incident_type: string;

  @ApiProperty({ description: 'Description of the incident' })
  @Column('text')
  description: string;

  @ApiProperty({ description: 'Location where the incident occurred', enum: NigerianStates })
  @Column({ type: 'enum', enum: NigerianStates })
  location: NigerianStates;

  @ApiProperty({ description: 'Encrypted contact info of the reporter' })
  @Column({ nullable: true, transformer: {
    to: (value: string) => value ? encrypt(value) : null,
    from: (value: string) => value ? decrypt(value) : null
  }})
  contact_info: string;

  @ApiProperty({ description: 'Encrypted user ID who reported the incident' })
  @Column({ transformer: {
    to: (value: string) => value ? encrypt(value) : null,
    from: (value: string) => value ? decrypt(value) : null
  }})
  user_id: string;

  @ApiProperty({ description: 'Files associated with the report' })
  @Column('jsonb', { default: [] })
  files: Array<{ file_path: string; uploaded_at: Date }>;

  @ApiProperty({ description: 'Status of the report', enum: ReportStatus })
  @Column({ type: 'enum', enum: ReportStatus, default: ReportStatus.SUBMITTED })
  status: ReportStatus;

  @Column('simple-array', { nullable: true })
  rejected_by: string[];

  @Column('simple-array', { nullable: true })
  accepted_by: string[];

  @ApiProperty({ description: 'Rejection reasons' })
  @Column('jsonb', { default: [] })
  rejection_reasons: Array<{
    reason: string;
    rejected_by: string;
    rejected_at: Date;
  }>;

  @Column('simple-array', { default: [] })
  ngo_dashboard_ids: string[];

  @Column({ default: false })
  isProcessing: boolean;

  @Column('simple-array', { default: [] })
  assignedUsers: string[];

  @ApiProperty({ description: 'AI analysis of the incident' })
  @Column('jsonb', { nullable: true })
  ai_analysis: {
    urgency: string;
    classification: string;
    extracted_entities: {
      location?: string;
      incidentType?: string;
      timeframe?: string;
      victimAge?: number;
      perpetratorRelationship?: string;
    };
    recommended_actions: string[];
    immediate_danger: boolean;
    medical_attention_needed: boolean;
    police_involvement_recommended: boolean;
    recommended_ngo_types: string[];
    psychological_state?: string;
    action_plan?: string[];
    analyzed_at: Date;
  };

  @Column('jsonb', { default: [] })
  status_history: Array<{
    from: string;
    to: string;
    event: string;
    reason: string | null;
    by: string;
    at: Date;
  }>;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
