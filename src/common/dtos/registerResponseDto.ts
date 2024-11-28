import { ApiProperty } from '@nestjs/swagger';

export class RegisterResponseDto {
  @ApiProperty({
    description: 'Message indicating successful registration',
    example: 'Registration successful. Please verify your email.',
  })
  message: string;

  @ApiProperty({
    description: 'Additional data related to the registration',
    example: {
      user: {
        id: '63f6b3eaf6477d49f87e9c7f',
        email: 'user@example.com',
        name: 'John Doe',
      },
    },
  })
  data?: any
}
