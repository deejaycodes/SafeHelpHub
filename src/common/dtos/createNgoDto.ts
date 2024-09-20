import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsPhoneNumber,
  MinLength,
  MaxLength,
  Matches,
  IsOptional,
  IsIn,
  ValidateNested,
  IsArray,
  ArrayMinSize,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';

// ContactInfo DTO for primary and secondary contact validation
class PrimaryContactDto {
  @ApiProperty({
    description: "Primary contact person's name",
    example: 'John Doe',
  })
  @IsString({ message: 'Primary contact name must be a string' })
  @IsNotEmpty({ message: 'Primary contact name is required' })
  name: string;

  @ApiProperty({
    description: "Primary contact person's email",
    example: 'john.doe@ngoemail.com',
  })
  @IsEmail({}, { message: 'Primary contact email must be valid' })
  @IsNotEmpty({ message: 'Primary contact email is required' })
  email: string;

  @ApiProperty({
    description: "Primary contact person's phone",
    example: '+2348000000000',
  })
  @IsPhoneNumber(null, {
    message:
      'Primary contact phone number must be a valid international number',
  })
  @IsNotEmpty({ message: 'Primary contact phone is required' })
  phone: string;
}

class SecondaryContactDto {
  @ApiPropertyOptional({
    description: "Secondary contact person's name",
    example: 'Jane Doe',
  })
  @IsOptional()
  @IsString({ message: 'Secondary contact name must be a string' })
  name?: string;

  @ApiPropertyOptional({
    description: "Secondary contact person's email",
    example: 'jane.doe@ngoemail.com',
  })
  @IsOptional()
  @IsEmail({}, { message: 'Secondary contact email must be valid' })
  email?: string;

  @ApiPropertyOptional({
    description: "Secondary contact person's phone",
    example: '+2348012345678',
  })
  @IsOptional()
  @IsPhoneNumber(null, {
    message: 'Secondary contact phone number must be valid',
  })
  phone?: string;
}

class ContactInfoDto {
  @ApiProperty({
    description: 'Primary contact details',
  })
  @ValidateNested()
  @Type(() => PrimaryContactDto)
  primary_contact: PrimaryContactDto;

  @ApiPropertyOptional({
    description: 'Secondary contact details (optional)',
  })
  @ValidateNested()
  @Type(() => SecondaryContactDto)
  @IsOptional()
  secondary_contact?: SecondaryContactDto;
}

export class CreateNgoDto {
  @ApiProperty({
    description: 'Name of the NGO',
    example: 'Safe Home Foundation',
  })
  @IsString()
  @IsNotEmpty({ message: 'NGO name is required' })
  ngo_name: string;

  @ApiProperty({
    description: 'Registration number of the NGO',
    example: 'NGO-123456',
  })
  @IsString()
  @IsNotEmpty({ message: 'Registration number is required' })
  registration_number: string;

  @ApiProperty({
    description: 'Primary location of the NGO',
    example: {
      address: '123 Charity Lane, Lagos, Nigeria',
      city: 'Lagos',
      state: 'Lagos State',
      country: 'Nigeria',
      latitude: 6.5244,
      longitude: 3.3792,
    },
  })
  @IsNotEmpty({ message: 'Primary location is required' })
  primary_location: {
    address: string;
    city: string;
    state: string;
    country: string;
    latitude: number;
    longitude: number;
  };

  @ApiProperty({
    description: 'Incident types supported by the NGO',
    example: ['domestic_violence', 'child_abuse', 'FGM'],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one incident type is required' })
  incident_types_supported: string[];

  @ApiProperty({
    description: 'Services provided by the NGO',
    example: ['counselling', 'legal_aid', 'medical_support'],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one service is required' })
  services_provided: string[];

  @ApiProperty({
    description: 'Contact information for the NGO',
  })
  @ValidateNested()
  @Type(() => ContactInfoDto)
  contact_info: ContactInfoDto;

  @ApiProperty({
    description:
      'Password for the user, must be 8-20 characters long and contain at least one letter, one number, and one special character',
    example: 'P@ssw0rd123',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(20, { message: 'Password must not exceed 20 characters' })
  @Matches(/^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[\W_]).{8,}$/, {
    message:
      'Password must contain at least one letter, one number, and one special character',
  })
  password: string;

  @ApiPropertyOptional({
    description: 'Role of the user, can be either user, support, or admin',
    enum: ['user', 'support', 'admin'],
    example: 'user',
  })
  @IsOptional()
  @IsString()
  @IsIn(['ngo'], {
    message: 'Role must be either ngo',
  })
  role: string;

  @IsOptional()
  @IsString()
  verificationCode?: string;

  @ApiProperty({
    description: 'Reset code expiry time',
    example: '2024-09-20T10:00:00Z',
  })
  @IsDateString()
  @IsOptional() //
  verificationCodeExpiresAt?: Date;
}
