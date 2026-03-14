import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Report } from './report.entity';

@Entity('case_notes')
export class CaseNote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  reportId: string;

  @ManyToOne(() => Report)
  @JoinColumn({ name: 'reportId' })
  report: Report;

  @Column()
  ngoId: string;

  @Column()
  staffMember: string;

  @Column('text')
  content: string;

  @Column({ type: 'enum', enum: ['internal', 'victim_update', 'reporter_message', 'caseworker_reply'], default: 'internal' })
  type: string;

  @CreateDateColumn()
  createdAt: Date;
}
