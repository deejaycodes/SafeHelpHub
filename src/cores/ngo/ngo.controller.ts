import { Body, Controller, Post, HttpStatus, Request, Get, Query,  HttpException,  Req, Put, UseGuards, Delete } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { NgoService } from './ngo.service';
import { CreateNgoDto } from 'src/common/dtos/createNgoDto';
import { RegisterResponseDto } from 'src/common/dtos/registerResponseDto';
import { UsersService } from 'src/basics/users/users.service';
import { User } from 'src/common/schemas/users.schema';
import { UpdateNgoDto } from 'src/common/dtos/updateNgoDto';
import { JwtAuthGuard } from '../authentication/strategy/jwt-guard';
import { AuthGuard } from '@nestjs/passport';


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


  @Put('onboard')
@ApiOperation({
  summary: 'Update an NGO by user ID',
  description: 'Updates the details of an NGO based on the provided user ID and update data.',
})

@ApiBody({
  description: 'The data to update the NGO',
  type: UpdateNgoDto, 
})
@ApiResponse({
  status: HttpStatus.OK,
  description: 'NGO updated successfully.',
  schema: {
    example: {
      message: 'NGO updated successfully.',
    },
  },
})
@ApiResponse({
  status: HttpStatus.BAD_REQUEST,
  description: 'Invalid input data.',
  schema: {
    example: {
      statusCode: 400,
      message: 'Bad Request',
    },
  },
})
@ApiResponse({
  status: HttpStatus.INTERNAL_SERVER_ERROR,
  description: 'Internal server error.',
  schema: {
    example: {
      statusCode: 500,
      message: 'Failed to update NGO',
    },
  },
})
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth('jwt')
async updateNgo(
  @Request() req: any,
  @Body() updateNgoDto: UpdateNgoDto, 
): Promise<any> {
  try {
    const userFromJwt = req.user 
    return await this.usersService.updateNgo(userFromJwt.id, updateNgoDto);
  } catch (error) {
    throw new HttpException(
      error.response || 'Failed to update NGO',
      error.status || HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}

@UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('jwt')
  @ApiOperation({ summary: 'Delete a NGO ' })
  @ApiResponse({ status: 200, description: 'NGO deleted successfully' })
  @ApiResponse({ status: 404, description: 'NGO not found' })
  @Delete()
  async deleteUser(@Req() req): Promise<{ message: string }> {
    return this.usersService.removeUser(req.user.id);
  }
}
