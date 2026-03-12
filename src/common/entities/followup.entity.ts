import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Report } from './report.entity';

@Entity('followups')
export class FollowUp {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  reportId: string;

  @ManyToOne(() => Report)
  @JoinColumn({ name: 'reportId' })
  report: Report;

  @Column()
  ngoId: string;

  @Column({ type: 'timestamp' })
  scheduledDate: Date;

  @Column('text', { nullable: true })
  notes: string;

  @Column({ type: 'enum', enum: ['pending', 'completed', 'cancelled'], default: 'pending' })
  status: string;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @Column('text', { nullable: true })
  outcome: string;

  @CreateDateColumn()
  createdAt: Date;
}
