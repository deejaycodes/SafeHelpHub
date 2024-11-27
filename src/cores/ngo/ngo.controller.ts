import { Body, Controller, Post, HttpStatus, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { NgoService } from './ngo.service';
import { CreateNgoDto } from 'src/common/dtos/createNgoDto';
import { RegisterResponseDto } from 'src/common/dtos/registerResponseDto';
import { UsersService } from 'src/basics/users/users.service';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { NigerianStates } from 'src/common/enums/nigeria-states.enum';
import { User } from 'src/common/schemas/users.schema';

class FindNgoQueryDto {
  @IsOptional()
  @IsEnum(NigerianStates, { message: 'State must be a valid Nigerian state.' })
  state?: NigerianStates;

  @IsOptional()
  @IsString()
  ngo_name?: string;
}

@ApiTags('Ngo')
@Controller('ngo')
export class NgoController {
  constructor(
    private readonly ngoService: NgoService,
    private readonly usersService: UsersService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Signup endpoint for registering an NGO' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'NGO registered successfully',
    type: RegisterResponseDto,
    schema: {
      example: {
        id: 'ngo123',
        ngo_name: 'Help Foundation',
        registration_number: '123456789',
        primary_location: 'Lagos, Nigeria',
        incident_types_supported: ['Domestic Violence', 'Child Abuse'],
        services_provided: ['Counseling', 'Legal Aid'],
        email: 'ngo@example.com',
        created_at: '2024-10-04T08:00:00Z',
        updated_at: '2024-10-04T08:00:00Z',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation error or missing required fields',
    schema: {
      example: {
        statusCode: 400,
        message: 'Invalid input data',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'NGO registration number or email already exists',
    schema: {
      example: {
        statusCode: 409,
        message: 'NGO with this registration number or email already exists.',
      },
    },
  })
  async createUser(
    @Body() createNgoDto: CreateNgoDto,
  ): Promise<RegisterResponseDto> {
    return this.ngoService.registerNgo(createNgoDto);
  }

  @Get('search')
  @ApiOperation({ summary: 'Find NGOs by state or name' })
  @ApiQuery({
    name: 'query',
    required: false,
    description: 'Search term to find NGOs by state or name',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'A list of NGOs matching the search criteria',
    type: [User],
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid query parameters',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async findNgoByLocationOrName(@Query('query') query?: string) {
    return this.usersService.findNgoByLocationOrName(query);
  }
  
}
