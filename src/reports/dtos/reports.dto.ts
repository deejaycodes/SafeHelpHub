import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsIn,
  ValidateNested,
  IsEmail,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class FileDto {
  @ApiProperty({ description: 'Path of the uploaded file', example: 'uploads/report123.pdf' })
  @IsString()
  @IsNotEmpty()
  file_path: string;

  @ApiProperty({ description: 'Date when the file was uploaded', example: '2023-09-12T14:48:00.000Z' })
  @IsString()
  uploaded_at: Date;
}

export class CreateIncidentDto {
  @ApiProperty({ description: 'Type of the incident reported', example: 'harassment' })
  @IsString()
  @IsNotEmpty()
  incident_type: string;

  @ApiProperty({ description: 'Description of the incident', example: 'Details of the incident' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: 'Location where the incident occurred', example: 'Lagos, Nigeria' })
  @IsString()
  @IsNotEmpty()
  location: string;

  @ApiPropertyOptional({ description: 'Contact information of the reporter (optional)', example: 'reporter@example.com' })
  @IsString()
  @IsOptional()
  @IsEmail({}, { message: 'Invalid email format' })
  contact_info?: string;

  @ApiPropertyOptional({
    description: 'Array of file objects related to the incident (optional)',
    type: [FileDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FileDto)
  files?: FileDto[];

  @ApiPropertyOptional({
    description: 'Status of the incident',
    enum: ['submitted', 'in review', 'resolved'],
    default: 'submitted',
  })
  @IsIn(['submitted', 'in review', 'resolved'])
  @IsOptional()
  status?: string = 'submitted';
}
