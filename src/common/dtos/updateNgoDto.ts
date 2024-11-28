import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
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
    })
    @IsString()
    @IsNotEmpty({ message: 'City is required' })
    city: string;
  
    @ApiProperty({
      description: 'State in Nigeria where the NGO is located',
      enum: NigerianStates,
      example: NigerianStates.LAGOS,
    })
    @IsIn(Object.values(NigerianStates), { message: 'Invalid state' })
    state: NigerianStates;
  }
  


export class UpdateNgoDto {
    @ApiPropertyOptional({
        description: 'Primary location of the NGO',
      })
      @ValidateNested()
      @Type(() => PrimaryLocationDto)
      @IsOptional()
      primary_location?: PrimaryLocationDto;

  @ApiPropertyOptional({
    description: 'Array of incident type IDs supported by the NGO',
    example: ['63f7c1e8c839e4b8a2c8a921', '63f7c1e8c839e4b8a2c8a922'],
  })
  @IsArray()
  @IsOptional()
  @IsMongoId({ each: true })
  incident_types_supported?: string[];

  @ApiPropertyOptional({
    description: 'Registration number of the NGO',
    example: 'NGO-123456',
  })
  @IsString()
  @IsOptional()
  registration_number?: string;

}
