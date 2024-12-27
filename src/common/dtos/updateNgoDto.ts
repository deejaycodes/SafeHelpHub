import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsIn,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { NigerianStates } from '../enums/nigeria-states.enum';

class PrimaryLocationDto {
  @ApiProperty({
    description: 'Address of the NGO',
    example: '123 Charity Lane, Lagos, Nigeria',
  })
  @IsString()
  @IsNotEmpty({ message: 'Address is required' })
  address: string;

  @ApiProperty({
    description: 'City where the NGO is located',
    example: 'Lagos',
    required: false,
  })
  @IsString()
  @IsOptional() 
  city?: string; 

  @ApiProperty({
    description: 'State in Nigeria where the NGO is located',
    enum: NigerianStates,
    example: NigerianStates.LAGOS,
  })
  @IsIn(Object.values(NigerianStates), { message: 'Invalid state' })
  state: NigerianStates;
}


export class PrimaryContactDto {
  @ApiProperty({
    description: 'Full name of the primary contact person',
    example: 'John Doe',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Email address of the primary contact person',
    example: 'john.doe@ngoemail.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Phone number of the primary contact person',
    example: '+2348000000000',
  })
 
  phone: string;
}

export class ContactInfoDto {
  @ApiProperty({ description: 'Primary contact details' })
  @ValidateNested()
  @Type(() => PrimaryContactDto)
  primary_contact: PrimaryContactDto;

 
}


export class UpdateNgoDto {
  @ApiPropertyOptional({
    description: 'Primary location of the NGO',
  })
  @ValidateNested()
  @Type(() => PrimaryLocationDto)
  @IsOptional()
  primary_location?: PrimaryLocationDto;

  @ApiProperty({
    description: 'Array of incident type IDs supported by the NGO',
    example: ['63f7c1e8c839e4b8a2c8a921', '63f7c1e8c839e4b8a2c8a922'],
  })
  @IsArray()
  @IsMongoId({ each: true })
  @IsNotEmpty({ message: 'Incident type is required' }) 
  incident_types_supported: string[];

  @ApiPropertyOptional({
    description: 'Registration number of the NGO',
    example: 'NGO-123456',
  })
  @IsString()
  @IsOptional()
  registration_number?: string;

  @ApiPropertyOptional({
    description: 'Indicates if the NGO is onboarded',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  onBoard?: boolean;
}


export class NgoDto {
  ngo_name: string;
  admin_name: string;
  registration_number: string;
  primary_location: {
    address: string;
    city?: string;
    state: string;
  };
  contact_info: {
    primary_contact: {
      name: string;
      email: string;
      phone: string;
    };
  }
}
