import { Body, Controller, Post, UseGuards, Request } from '@nestjs/common';
import { CreateUserDto } from '../../common/dtos/createUserDto';
import { LocalAuthGuard } from './strategy/local-auth-strategy';
import { JwtService } from '@nestjs/jwt';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthenticationService } from './authentication.service';
import { RegisterResponseDto } from 'src/common/dtos/registerResponseDto.dto';

@ApiTags('authentication')
@Controller('users/auth')
export class AuthsController {
  constructor(
    private readonly authService: AuthenticationService,
    private jwtService: JwtService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'signup endpoint' })
  async createUser(
    @Body() createUserDto: CreateUserDto,
  ): Promise<RegisterResponseDto> {
    return this.authService.register(createUserDto);
  }

  @ApiOperation({ summary: 'login endpoint' })
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req) {
    const payload = {
      id: req.user.id,
      username: req.user.username,
      role: req.user.role,
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
