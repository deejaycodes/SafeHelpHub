import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersRepository } from 'src/basics/users/users.repository';
import { UsersService } from 'src/basics/users/users.service';
import { CreateUserDto } from 'src/common/dtos/createUserDto';
import * as bcrypt from 'bcryptjs';
import { RegisterResponseDto } from 'src/common/dtos/registerResponseDto';
import { EmailService } from 'src/basics/email/email.service';
import { randomInt } from 'crypto';

@Injectable()
export class AuthenticationService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly usersRepository: UsersRepository,
    private readonly emailService: EmailService,
  ) {}

  async register(createUserDto: CreateUserDto): Promise<RegisterResponseDto> {
    const { email } = createUserDto;
    const verificationCode = randomInt(100000, 999999).toString();
    const verificationCodeExpiresAt = new Date(Date.now() + 30 * 1000);
    await this.usersService.createUser({
      ...createUserDto,
      verificationCode: verificationCode,
      verificationCodeExpiresAt: verificationCodeExpiresAt,
    });
    await this.emailService.sendVerificationEmail(email, verificationCode);
    return {
      message: 'Registration successful. Please verify your email.',
      token: this.jwtService.sign(email, {
        secret: process.env.JWT_KEY,
      }),
    };
  }

  // validate user
  async validate(
    email: string,
    password: string,
  ): Promise<{ access_token: string }> {
    const user = await this.usersRepository.findUserByCriteria({ email });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Compare the hashed password
    const passwordMatches = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }
}
