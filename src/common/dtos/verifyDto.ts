import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyAccountDto {
  @ApiProperty({
    description: 'Email address of the user to verify',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: 'Invalid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty({
    description: 'Verification code sent to the user’s email',
    example: '123456',
  })
  @IsString({ message: 'Verification code must be a string' })
  @IsNotEmpty({ message: 'Verification code is required' })
  'verification-code': string;
}

export class ResendVerificationCodeDto{
  @ApiProperty({
    description: 'The email address of the user requesting a new verification code.',
    example: 'user@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
