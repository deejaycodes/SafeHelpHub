import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtService } from '@nestjs/jwt';

@ApiTags('authentication')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('forgot-password')
  async forgotPassword(@Body('email') email: string): Promise<any> {
    return this.usersService.sendForgotPasswordCode(email);
  }

  @Post('reset-password')
  async resetPassword(
    @Body('email') email: string,
    @Body('resetCode') resetCode: string,
    @Body('newPassword') newPassword: string,
  ): Promise<any> {
    return this.usersService.validateResetCodeAndResetPassword(
      email,
      resetCode,
      newPassword,
    );
  }
}
