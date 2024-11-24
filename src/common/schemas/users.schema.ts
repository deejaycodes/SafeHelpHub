import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { IsString} from 'class-validator';
import { NigerianStates } from '../enums/nigeria-states.enum';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @ApiProperty({
    description: 'Name of the NGO',
    example: 'Safe Home Foundation',
  })
  @Prop({ type: String })
  ngo_name: string;

  @ApiProperty({
    description: 'Registration number of the NGO',
    example: 'NGO-123456',
  })
  @Prop({ type: String })
  registration_number: string;

  @ApiProperty({
    description: 'Primary location of the NGO',
    example: {
      address: '123 Charity Lane, Lagos, Nigeria',
      city: 'Lagos',
      state: NigerianStates.LAGOS,
    },
  })
  @Prop({
    type: {
      address: { type: String },
      city: { type: String },
      state: { type: String },
    },
  })
  primary_location: {
    address: string;
    city: string;
    state: NigerianStates;
  };

  @ApiProperty({
    description: 'Incident types supported by the NGO',
    example: [
      'domestic_violence',
      'child_abuse',
      'FGM',
      'sexual_assault',
      'trafficking',
    ],
  })
  @Prop({
    type: [String],
    enum: [
      'domestic_violence',
      'child_abuse',
      'FGM',
      'sexual_assault',
      'trafficking',
    ],
  })
  incident_types_supported: string[];

  @ApiProperty({
    description: 'Services provided by the NGO',
    example: [
      'counselling',
      'legal_aid',
      'medical_support',
      'emergency_shelter',
      'financial_assistance',
    ],
  })
  @Prop({
    type: [String],
    enum: [
      'counselling',
      'legal_aid',
      'medical_support',
      'emergency_shelter',
      'financial_assistance',
    ],
  })
  services_provided: string[];

  @ApiProperty({
    description: 'Contact information for the NGO',
    example: {
      primary_contact: {
        name: 'John Doe',
        email: 'john.doe@ngoemail.com',
        phone: '+2348000000000',
      },
      secondary_contact: {
        name: 'Jane Doe',
        email: 'jane.doe@ngoemail.com',
        phone: '+2348012345678',
      },
    },
  })
  @Prop({
    type: {
      primary_contact: {
        name: { type: String, required: true },
        email: { type: String, required: true },
        phone: { type: String, required: true },
      },
      secondary_contact: {
        name: { type: String },
        email: { type: String },
        phone: { type: String },
      },
    },
  })
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

  // User-related fields
  @ApiProperty({
    description: 'Unique username for the user creating the NGO',
    example: 'john_doe',
  })
  @Prop({ type: String })
  username: string;

  @ApiProperty({
    description: 'Unique email for the user creating the NGO',
    example: 'john_doe@example.com',
  })
  @Prop({ unique: true })
  email: string;

  @ApiProperty({
    description: 'report assigned',
   
  })
  @Prop({ type: String })
  currentlyAssignedReports:string

  @ApiProperty({
    description: 'Hashed password for the user',
    example: 'hashedpassword123',
  })
  @Prop({ required: true })
  password_hash: string;

  @ApiProperty({
    description: 'code to reset a password, it will be drop on user email',
    example: '1234',
  })
  @Prop({ type: String })
  resetCode: string;

  @ApiProperty({
    description: 'resetcode expiry time',
  })
  @Prop({ type: Date, default: null })
  resetCodeExpiresAt: Date;

  @ApiProperty({
    description: 'Role of the user',
    enum: ['user', 'support', 'admin'],
    example: 'admin',
  })
  @Prop({
    type: String,
    enum: ['user', 'ngo', 'admin'],
    default: 'user',
  })
  role: string;

  @ApiProperty({
    description: 'Whether the user has verified their email',
    example: false,
  })
  @Prop({ default: false })
  isVerified: boolean;

  @ApiProperty({
    description: 'Profile picture file path',
    type: String,
    example: 'uploads/profile_picture123.jpg',
  })
  @IsString()
  @Prop({ type: String })
  profilePicture: string;

  @ApiProperty({
    description: 'Rank of the user',
    enum: [1, 2, 3],
    example: 1,
  })
  @Prop({
    type: Number,
    enum: [1, 2, 3],
    default: 1,
  })
  rank: number;

  @Prop({ type: Boolean, default: false })
  isHandlingReport: boolean;

  @Prop({ type: Number, default: 0 })
  resolvedReportsCount: number;

  @Prop({ type: Number, default: 0 })
  rejectedReportsCount: number;

  @Prop({ type: Number, default: 0 })
  acceptReportsCount: number;

  @ApiProperty({
    description: 'code to reset a password, it will be drop on user email',
    example: '1234',
  })
  @Prop({ type: String })
  verificationCode: string;

  @ApiProperty({
    description: 'resetcode expiry time',
  })
  @Prop({ type: Date, default: null })
  verificationCodeExpiresAt: Date;

  @ApiProperty({
    description: 'Date when the record was created',
    example: '2024-09-16T10:15:00.000Z',
  })
  @Prop({ type: Date, default: Date.now })
  created_at: Date;

  @ApiProperty({
    description: 'Date when the record was last updated',
    example: '2024-09-16T10:15:00.000Z',
  })
  @Prop({ type: Date, default: Date.now })
  updated_at: Date;
}
export const UserSchema = SchemaFactory.createForClass(User);

// Pre-save hook to lowercase user email and NGO primary contact email
UserSchema.pre<UserDocument>('save', function (next) {
  if (this.email) {
    this.email = this.email.toLowerCase();
  }

  if (this.contact_info && this.contact_info.primary_contact.email) {
    this.contact_info.primary_contact.email =
      this.contact_info.primary_contact.email.toLowerCase();
  }

  next();
});

// Ensure case-insensitive unique indexes for user email
UserSchema.index(
  { email: 1 },
  { unique: true, collation: { locale: 'en', strength: 2 } },
);

// Ensure case-insensitive unique indexes for NGO primary contact email
UserSchema.index(
  { 'contact_info.primary_contact.email': 1 },
  { unique: true, sparse: true, collation: { locale: 'en', strength: 2 } },
);
