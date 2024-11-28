import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  ValidateNested,
  IsIn,
  IsOptional,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';

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
  @IsString()
  @IsNotEmpty({ message: 'Primary contact email is required' })
  email: string;

  @ApiProperty({
    description: "Primary contact person's phone",
    example: '+2348000000000',
  })
  @IsString()
  @IsNotEmpty({ message: 'Primary contact phone is required' })
  phone: string;
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
    description: 'Primary contact details for the NGO',
  })
  @ValidateNested()
  @Type(() => PrimaryContactDto)
  primary_contact: PrimaryContactDto;

  @ApiProperty({
    description:
      'Password for the user, must be 8-20 characters long and contain at least one letter, one number, and one special character',
    example: 'P@ssw0rd123',
  })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiPropertyOptional({
    description: 'Role of the user, can be either user, support, or admin',
    enum: ['user', 'support', 'admin'],
    example: 'user',
  })
  @IsOptional()
  @IsString()
  @IsIn(['ngo'], {
    message: 'Role must be ngo',
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
  @IsOptional()
  verificationCodeExpiresAt?: Date;
}
