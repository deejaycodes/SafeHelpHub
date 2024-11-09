import {
  IsString,
  IsNotEmpty,
  IsIn,
  Matches,
  MaxLength,
  MinLength,
  IsOptional,
  IsEmail,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    description: 'Unique username for the user',
    example: 'john_doe',
  })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty({
    description:
      'Password for the user, must be 8-20 characters long and contain at least one letter, one number, and one special character',
    example: 'P@ssw0rd123',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(20, { message: 'Password must not exceed 20 characters' })
  @Matches(/^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[\W_]).{8,}$/, {
    message:
      'Password must contain at least one letter, one number, and one special character',
  })
  password: string;

  @ApiPropertyOptional({
    description: 'Role of the user, can be either user, support, or admin',
    enum: ['user', 'ngo', 'admin'],
    example: 'user',
  })
  @IsOptional()
  @IsString()
  @IsIn(['user', 'support', 'admin'])
  role: string;

  @ApiProperty({
    description: 'Code to reset a password, it will be sent to the user email',
    example: '1234',
  })
  @IsOptional()
  @IsString()
  verificationCode?: string;

  @ApiProperty({
    description: 'Reset code expiry time',
    example: '2024-09-20T10:00:00Z',
  })
  @IsDateString()
  @IsOptional()
  verificationCodeExpiresAt?: Date;
}
