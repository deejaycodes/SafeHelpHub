import {
    IsString,
    IsNotEmpty,
    IsOptional,
    IsArray,
    IsIn,
    ValidateNested,
    IsMongoId,
    IsEmail,
  } from 'class-validator';
  import { Type } from 'class-transformer';
  
  class FileDto {
    @IsString()
    @IsNotEmpty()
    file_path: string;
  
    @IsString()
    uploaded_at: Date;
  }
  
  export class CreateIncidentDto {
    @IsString()
    @IsNotEmpty()
    incident_type: string;
  
    @IsString()
    @IsNotEmpty()
    description: string;
  
    @IsString()
    @IsNotEmpty()
    location: string;
  
    @IsString()
    @IsOptional() 
    @IsEmail({}, { message: 'Invalid email format' })
    contact_info?: string;
  
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => FileDto)
    files?: FileDto[];
  
    @IsIn(['submitted', 'in review', 'resolved'])
    @IsOptional()
    status?: string = 'submitted';
  }
  