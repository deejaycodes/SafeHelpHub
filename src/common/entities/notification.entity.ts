import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

export enum NotificationStatus {
  UNREAD = 'unread',
  READ = 'read',
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'The NGO being notified', type: String })
  @Column()
  ngoId: string;

  @ApiProperty({ description: 'The report associated with the notification', type: String })
  @Column()
  reportId: string;

  @ApiProperty({ description: 'Notification message content' })
  @Column('text')
  message: string;

  @ApiProperty({ description: 'Status of the notification', enum: NotificationStatus })
  @Column({ type: 'enum', enum: NotificationStatus, default: NotificationStatus.UNREAD })
  status: NotificationStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
