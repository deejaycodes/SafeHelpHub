import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, BeforeInsert, BeforeUpdate } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { NigerianStates } from '../enums/nigeria-states.enum';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Name of the NGO', example: 'Safe Home Foundation' })
  @Column({ nullable: true })
  ngo_name: string;

  @ApiProperty({ description: 'Name of the NGO Admin', example: 'John-doe' })
  @Column({ nullable: true })
  admin_name: string;

  @ApiProperty({ description: 'Registration number of the NGO', example: 'NGO-123456' })
  @Column({ nullable: true })
  registration_number: string;

  @ApiProperty({ description: 'Primary location of the NGO' })
  @Column('jsonb', { nullable: true })
  primary_location: {
    address: string;
    city?: string;
    state: NigerianStates;
  };

  @ApiProperty({ description: 'Incident types supported', type: [String] })
  @Column('simple-array', { nullable: true })
  incident_types_supported: string[];

  @ApiProperty({ description: 'Services provided by the NGO' })
  @Column('simple-array', { nullable: true })
  services_provided: string[];

  @ApiProperty({ description: 'Contact information for the NGO' })
  @Column('jsonb', { nullable: true })
  contact_info: {
    primary_contact: {
      name: string;
      email: string;
      phone: string;
    };
    secondary_contact?: {
      name?: string;
      email?: string;
      phone?: string;
    };
  };

  @ApiProperty({ description: 'Unique username', example: 'john_doe' })
  @Column({ nullable: true })
  username: string;

  @ApiProperty({ description: 'Unique email', example: 'john_doe@example.com' })
  @Column({ unique: true })
  email: string;

  @ApiProperty({ description: 'Currently assigned reports' })
  @Column({ nullable: true })
  currentlyAssignedReports: string;

  @ApiProperty({ description: 'Hashed password' })
  @Column()
  password_hash: string;

  @ApiProperty({ description: 'Password reset code' })
  @Column({ nullable: true })
  resetCode: string;

  @ApiProperty({ description: 'Reset code expiry time' })
  @Column({ type: 'timestamp', nullable: true })
  resetCodeExpiresAt: Date;

  @ApiProperty({ description: 'Role of the user', enum: ['user', 'ngo', 'admin'] })
  @Column({ type: 'enum', enum: ['user', 'ngo', 'admin'], default: 'user' })
  role: string;

  @ApiProperty({ description: 'Email verification status' })
  @Column({ default: false })
  isVerified: boolean;

  @ApiProperty({ description: 'Profile picture details' })
  @Column('jsonb', { nullable: true })
  profilePicture: { file_path: string; uploaded_at: Date };

  @ApiProperty({ description: 'Verified documents' })
  @Column('jsonb', { nullable: true })
  files: Array<{ file_path: string; uploaded_at: Date }>;

  @ApiProperty({ description: 'Rank of the user', enum: [1, 2, 3] })
  @Column({ type: 'int', default: 1 })
  rank: number;

  @Column({ default: false })
  isHandlingReport: boolean;

  @Column({ type: 'int', default: 0 })
  resolvedReportsCount: number;

  @Column({ type: 'int', default: 0 })
  rejectedReportsCount: number;

  @Column({ type: 'int', default: 0 })
  acceptReportsCount: number;

  @ApiProperty({ description: 'Email verification code' })
  @Column({ nullable: true })
  verificationCode: string;

  @ApiProperty({ description: 'Verification code expiry time' })
  @Column({ type: 'timestamp', nullable: true })
  verificationCodeExpiresAt: Date;

  @ApiProperty({ description: 'Onboarding status' })
  @Column({ default: false })
  onBoard: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @BeforeInsert()
  @BeforeUpdate()
  lowercaseEmail() {
    if (this.email) {
      this.email = this.email.toLowerCase();
    }
    if (this.contact_info?.primary_contact?.email) {
      this.contact_info.primary_contact.email = this.contact_info.primary_contact.email.toLowerCase();
    }
  }
}
