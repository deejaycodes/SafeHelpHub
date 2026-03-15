import {
  Body,
  Controller,
  Post,
  UseGuards,
  Request,
  HttpStatus,
  Headers,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto } from 'src/common/dtos/createUserDto';
import { LoginDto } from 'src/common/dtos/loginDto';
import { RegisterResponseDto } from 'src/common/dtos/registerResponseDto';
import { AuthenticationService } from './authentication.service';
import { LocalAuthGuard } from './strategy/local-auth-strategy';
import { JwtAuthGuard } from './strategy/jwt-guard';
import { TokenBlacklistService } from './token-blacklist.service';
import { ReportsRepository } from '../reports/reports.repository';
import { Throttle } from '@nestjs/throttler';

@ApiTags('Authentication')
@Controller('auth')
export class AuthsController {
  constructor(
    private readonly authService: AuthenticationService,
    private readonly jwtService: JwtService,
    private readonly reportRepo: ReportsRepository,
    private readonly tokenBlacklist: TokenBlacklistService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Signup endpoint' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'User registered successfully',
    type: RegisterResponseDto,
    schema: {
      example: {
        id: '12345',
        username: 'user123',
        email: 'user@example.com',
        role: 'user',
        created_at: '2024-10-01T12:34:56Z',
        updated_at: '2024-10-01T12:34:56Z',
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
    description: 'Email already exists',
    schema: {
      example: {
        statusCode: 409,
        message: 'Email already exists.',
      },
    },
  })
  async createUser(
    @Body() createUserDto: CreateUserDto,
  ): Promise<RegisterResponseDto> {
    return this.authService.register(createUserDto);
  }

  @Post('login')
  @Throttle({ short: { ttl: 1000, limit: 1 }, medium: { ttl: 60000, limit: 10 } })
  @ApiOperation({ summary: 'Login endpoint' })
  @ApiBody({
    type: LoginDto,
    description: 'Provide email and password to log in.',
    examples: {
      example1: {
        summary: 'Valid login example',
        description: 'An example of valid credentials.',
        value: {
          email: 'user@example.com',
          password: 'password123',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Login successful',
    schema: {
      example: {
        id: '12345',
        username: 'user123',
        email: 'user@example.com',
        role: 'user',
        created_at: '2024-10-01T12:34:56Z',
        updated_at: '2024-10-01T12:34:56Z',
        token: 'jwt_token_string_here',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid credentials',
    schema: {
      example: {
        statusCode: 401,
        message: 'Invalid username or password',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Missing required fields',
    schema: {
      example: {
        statusCode: 400,
        message: 'Email and password are required',
      },
    },
  })
  @UseGuards(LocalAuthGuard)
  async login(@Body() loginDto: LoginDto, @Request() req) {

    const counter = await this.reportRepo.countUserAssignments(req.user.id)
    const payload = {
      id: req.user.id,
      username: req.user.username,
      role: req.user.role,
      ngo:req.user.ngo_name,
      admin_phone:req.user.contact_info.primary_contact.phone,
      admin_name:req.user.contact_info.primary_contact.name,
      location:req.user.primary_location,
      email: req.user.email,
      onBoard:req.user.onBoard,
      resolved:req.user.resolvedReportsCount,
      rejected:req.user.rejectedReportsCount,
      pending:counter,
      created_at: req.user.created_at,
      updated_at: req.user.updated_at,
    };
  
    return {
      ...payload,
      token: this.jwtService.sign(payload, { secret: process.env.JWT_KEY || 'sporty_secretKey_for_sure' }),
    };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Logout endpoint' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Logged out successfully' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Not authenticated' })
  async logout(@Headers('authorization') auth: string) {
    const token = auth?.replace('Bearer ', '');
    if (token) {
      this.tokenBlacklist.add(token);
    }
    return { message: 'Logged out successfully' };
  }
}  