import { Injectable } from '@nestjs/common';
import { UsersRepository } from 'src/basics/users/users.repository';
import { CreateNgoDto } from 'src/common/dtos/createNgoDto';
import { RegisterResponseDto } from 'src/common/dtos/registerResponseDto.dto';
import { UsersService } from 'src/basics/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from 'src/basics/email/email.service';

@Injectable()
export class NgoService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
    private readonly usersRepository: UsersRepository,
  ) {}

  async registerNgo(createNgoDto: CreateNgoDto): Promise<RegisterResponseDto> {
    const email = createNgoDto.contact_info.primary_contact.email;
    let token;
    const role = createNgoDto.role;
    await this.usersService.createNgo({ ...createNgoDto, role: 'ngo' });
    await this.emailService.sendVerificationEmail(email, token);
    return {
      message: 'Registration successful. Please verify your email.',
      token: this.jwtService.sign(email, {
        secret: process.env.JWT_KEY,
      }),
    };
  }
}
