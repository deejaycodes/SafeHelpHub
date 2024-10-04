import { Body, Controller, Post, UseGuards, Request, HttpStatus } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto } from 'src/common/dtos/createUserDto';
import { LoginDto } from 'src/common/dtos/loginDto';
import { RegisterResponseDto } from 'src/common/dtos/registerResponseDto';
import { AuthenticationService } from './authentication.service';
import { LocalAuthGuard } from './strategy/local-auth-strategy';

@ApiTags('Authentication')
@Controller('auth')
export class AuthsController {
  constructor(
    private readonly authService: AuthenticationService,
    private readonly jwtService: JwtService,
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
  @ApiOperation({ summary: 'Login endpoint' })
  @ApiBody({ type: LoginDto })
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
    const payload = {
      id: req.user.id,
      username: req.user.username,
      role: req.user.role,
      email: req.user.email,
      created_at: req.user.created_at,
      updated_at: req.user.updated_at,
    };

    return {
      ...payload,
      token: this.jwtService.sign(payload, {
        secret: process.env.JWT_KEY,
      }),
    };
  }
}
