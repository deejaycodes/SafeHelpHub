import { ApiProperty } from '@nestjs/swagger';

export class RegisterResponseDto {
  @ApiProperty({
    description: 'Message indicating successful registration',
    example: 'Registration successful. Please verify your email.',
  })
  message: string;

  @ApiProperty({
    description: 'JWT token for email verification',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  token: string;
}
