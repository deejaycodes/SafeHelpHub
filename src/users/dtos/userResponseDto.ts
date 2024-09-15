import { IsString, IsNotEmpty, IsEnum } from 'class-validator';

export class UserResponseDto {

  @IsString()
  
  id: string
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsEnum(['user', 'support', 'admin'])
  role: string;

  @IsString()
  created_at: string;

  @IsString()
  updated_at: string;
}
