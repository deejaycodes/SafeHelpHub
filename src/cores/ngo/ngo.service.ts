import { Injectable } from '@nestjs/common';
import { UsersRepository } from 'src/basics/users/users.repository';
import { CreateNgoDto } from 'src/common/dtos/createNgoDto';
import { RegisterResponseDto } from 'src/common/dtos/registerResponseDto';
import { UsersService } from 'src/basics/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from 'src/basics/email/email.service';
import { randomInt } from 'crypto';

@Injectable()
export class NgoService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {}

  async registerNgo(createNgoDto: CreateNgoDto): Promise<RegisterResponseDto> {
    const email = createNgoDto.contact_info.primary_contact.email;
    const verificationCode = randomInt(100000, 999999).toString();
    const verificationCodeExpiresAt = new Date(Date.now() + 30 * 1000);
    await this.usersService.createNgo({
      ...createNgoDto,
      role: 'ngo',
      verificationCode: verificationCode,
      verificationCodeExpiresAt: verificationCodeExpiresAt,
    });
   // await this.emailService.sendVerificationEmail(email, verificationCode);
    return {
      message: 'Registration successful. Please verify your email.',
      token: this.jwtService.sign(email, {
        secret: process.env.JWT_KEY,
      }),
    };
  }

}
