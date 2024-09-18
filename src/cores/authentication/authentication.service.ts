import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersRepository } from 'src/basics/users/users.repository';
import { UsersService } from 'src/basics/users/users.service';
import { CreateUserDto } from 'src/common/dtos/createUserDto';
import * as bcrypt from 'bcryptjs';
import { VerifyEmailDto } from 'src/common/dtos/verify.dto';
import { RegisterResponseDto } from 'src/common/dtos/registerResponseDto.dto';
import { EmailService } from 'src/basics/email/email.service';
import { LoginDto } from 'src/common/dtos/loginDto';

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
    await this.usersService.createUser({ ...createUserDto });
   // await this.emailService.sendVerificationEmail(email, token);
    return {
      message: 'Registration successful. Please verify your email.',
      token: this.jwtService.sign(email, {
        secret: process.env.JWT_KEY,
      }),
    };
  }

  // validate user
  async validate(
   username:string, password:string
  ): Promise<{ access_token: string }> {

  //  const { username, password } = loginDto
    // Find user by username
    const user = await this.usersRepository.findUserByCriteria({ username });
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

  async verifyEmail(verifyEmailDto: VerifyEmailDto): Promise<void> {
    const { token } = verifyEmailDto;
    const decoded = this.jwtService.verify(token);
    await this.usersRepository.verifyUserEmail(decoded.email);
  }
}
