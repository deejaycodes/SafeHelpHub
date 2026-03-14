import { Injectable } from '@nestjs/common';
import { UsersRepository } from 'src/basics/users/users.repository';
import { CreateNgoDto } from 'src/common/dtos/createNgoDto';
import { RegisterResponseDto } from 'src/common/dtos/registerResponseDto';
import { UsersService } from 'src/basics/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from 'src/basics/email/email.service';
import { NgoInstrumentation } from 'src/common/instrumentation';
import { randomInt } from 'crypto';

@Injectable()
export class NgoService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
    private readonly instrumentation: NgoInstrumentation,
  ) {}

  async registerNgo(createNgoDto: CreateNgoDto): Promise<RegisterResponseDto> {
    const email = createNgoDto.primary_contact.email;
    const verificationCode = randomInt(100000, 999999).toString();
    const verificationCodeExpiresAt = new Date(Date.now() + 60 * 60 * 1000); // Set expiry to 60 minutes
    
   const ngo =  await this.usersService.createNgo({
      ...createNgoDto,
      role: 'ngo',
      verificationCode,
      verificationCodeExpiresAt,
    });
  
    try {
      await this.emailService.sendVerificationEmail(email, verificationCode);
    } catch (error) {
      console.error(`Failed to send verification email to ${email}: ${error.message}`);
    }

    this.instrumentation.ngoRegistered(ngo._id, createNgoDto.ngo_name, email);

    const user = {
      id: ngo._id,  
      email: ngo.email,
      name: ngo.contact_info.primary_contact.name,  
    };
  
    return {
      message: 'Registration successful. Please verify your email.',
      data: {
        user,
      },
    };
  }

}
