import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('incident_types')
export class IncidentType {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Unique name of the incident type', example: 'harassment' })
  @Column({ unique: true })
  name: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
