import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtService } from '@nestjs/jwt';
import { VerifyAccountDto } from 'src/common/dtos/verifyDto';

@ApiTags('users')
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
  @ApiOperation({ summary: 'Account verification' })
  @ApiResponse({
    status: 200,
    description: 'Account verified successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid verification code or email',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async verifyAccount(
    @Body() verifyAccountDto: VerifyAccountDto,
  ): Promise<{ message: string }> {
    return this.usersService.verifyAccount(verifyAccountDto);
  }
}
