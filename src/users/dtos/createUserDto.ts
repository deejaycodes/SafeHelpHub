import { IsString, IsNotEmpty, IsIn, Matches, MaxLength, MinLength, IsOptional } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(20, { message: 'Password must not exceed 20 characters' })
  @Matches(/^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[\W_]).{8,}$/, {
    message: 'Password must contain at least one letter, one number, and one special character',
  })
  password: string;

  @IsOptional()
  @IsString()
  @IsIn(['user', 'support', 'admin'])
  role: string;
}
