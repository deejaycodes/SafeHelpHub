import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from '../../common/dtos/createUserDto';
import * as bcrypt from 'bcryptjs';
import { randomInt } from 'crypto';
import { UserResponseDto } from '../../common/dtos/userResponseDto';
import { UsersRepository } from './users.repository';
import { CreateNgoDto } from 'src/common/dtos/createNgoDto';
import { EmailService } from '../email/email.service';
import { VerifyEmailDto } from 'src/common/dtos/verifyDto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly emailService: EmailService,
    private readonly jwtService: JwtService,
  ) {}

  async createUser(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    const { username, email, password } = createUserDto;

    const lowerCaseUsername = username.toLowerCase();
    const lowerCaseEmail = email.toLowerCase();

    //check if the user already exists
    const existingUser = await this.usersRepository.findUserByCriteria({
      $or: [{ username: lowerCaseUsername }, { email: lowerCaseEmail }],
    });
    if (existingUser) {
      throw new BadRequestException('username or email already exist');
    }

    // Hash the password before saving
    const password_hash = await bcrypt.hash(password, 10);

    //create a newUser document
    const newUser = {
      ...createUserDto,
      password_hash,
    };

    // save a newUser document
    const savedUser = await this.usersRepository.createUser(newUser);

    //return userResponse without password
    return {
      username: savedUser.username,
      role: savedUser.role,
      created_at: savedUser.created_at.toISOString(),
      updated_at: savedUser.updated_at.toISOString(),
    };
  }

  async createNgo(createNgoDto: CreateNgoDto): Promise<any> {
    const email = createNgoDto.contact_info.primary_contact.email.toLowerCase();

    // Check if the NGO user already exists
    const existingUser = await this.usersRepository.findUserByCriteria({
      email,
    });
    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    // Hash the password
    const password_hash = await bcrypt.hash(createNgoDto.password, 10);

    const savedUser = {
      ...createNgoDto,
      password_hash,
      contact_info: {
        primary_contact: {
          ...createNgoDto.contact_info.primary_contact,
        },
        secondary_contact: createNgoDto.contact_info.secondary_contact || {},
      },
      email,
    };

    return await this.usersRepository.createNgo(savedUser);
  }

  async sendForgotPasswordCode(email: string): Promise<{ message: string }> {
    const user = await this.usersRepository.findUserByCriteria({ email });
    if (!user) {
      throw new NotFoundException('User with this email does not exist.');
    }

    const resetCode = randomInt(1000, 9999).toString();

    const resetCodeExpiresAt = new Date(Date.now() + 60 * 1000);

    await this.usersRepository.updateUser(email, {
      resetCode,
      resetCodeExpiresAt,
    });

    await this.emailService.sendForgotPasswordEmail(email, resetCode);
    return { message: 'forgot password email sent successfully' };
  }

  async validateResetCodeAndResetPassword(
    email: string,
    resetCode: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const user = await this.usersRepository.findUserByCriteria({ email });
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    if (!user.resetCode || user.resetCode !== resetCode) {
      throw new BadRequestException('Invalid reset code.');
    }

    if (new Date() > new Date(user.resetCodeExpiresAt)) {
      throw new BadRequestException('Reset code has expired.');
    }

    const password_hash = await bcrypt.hash(newPassword, 10);

    await this.usersRepository.updateUser(email, {
      password_hash,
      resetCode: null,
      resetCodeExpiresAt: null,
    });

    return { message: 'Password reset successfully' };
  }

  async verifyAccount(
    email: string,
    verificationCode,
  ): Promise<{ message: string }> {
    const user = await this.usersRepository.findUserByCriteria({ email });
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    if (!user.verificationCode || user.verificationCode !== verificationCode) {
      throw new BadRequestException('Invalid reset code.');
    }
    await this.usersRepository.updateUser(email, {
      isVerified: true,
      verificationCode: null,
      verificationCodeExpiresAt: null,
    });

    return { message: 'Account verified successfully' };
  }
}
