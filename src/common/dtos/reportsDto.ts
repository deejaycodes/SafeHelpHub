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
  @ApiProperty({
    description: 'Path of the uploaded file',
    example: 'uploads/report123.pdf',
  })
  @IsString()
  @IsNotEmpty()
  file_path: string;

  @ApiProperty({
    description: 'Date when the file was uploaded',
    example: '2023-09-12T14:48:00.000Z',
  })
  @IsString()
  uploaded_at: Date;
}

export class CreateIncidentDto {
  @ApiProperty({
    description: 'Type of the incident reported',
    example: 'harassment',
  })
  @IsString()
  @IsNotEmpty()
  incident_type: string;

  @ApiProperty({
    description: 'Description of the incident',
    example: 'Details of the incident',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: 'Location where the incident occurred (state or state, LGA)',
    example: 'Lagos, Ikeja',
  })
  @IsString()
  @IsNotEmpty({ message: 'Location is required' })
  location: string;


  @ApiPropertyOptional({
    description: 'Contact information of the reporter (optional)',
    example: 'reporter@example.com',
  })
  @IsString()
  @IsOptional()
  @IsEmail({}, { message: 'Invalid email format' })
  contact_info?: string;

}
