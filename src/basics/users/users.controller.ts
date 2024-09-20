import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtService } from '@nestjs/jwt';

@ApiTags('authentication')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('forgot-password')
  @ApiOperation({ summary: 'forgotpassword endpoint' })
  async forgotPassword(@Body('email') email: string): Promise<any> {
    return this.usersService.sendForgotPasswordCode(email);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'reset-password endpoint' })
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

  @Post('verify')
  async verifyAccount(
    @Body('email') email: string,
    @Body('verification-code') code: string,
  ): Promise<any> {
    return this.usersService.verifyAccount(email, code);
  }
}
