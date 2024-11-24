import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Put,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { User } from '@sentry/nestjs';
import { VerifyAccountDto } from 'src/common/dtos/verifyDto';
import { SendForgotPasswordCodeDto } from 'src/common/dtos/sendForgotPasswordDto';
import { ValidateResetCodeAndResetPasswordDto } from 'src/common/dtos/validateResetPasswordDto';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/cores/authentication/strategy/jwt-guard';
import { UsersRepository } from './users.repository';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService,
    private readonly userRepo:UsersRepository
  ) {}

  @Post('forgot-password')
  @ApiOperation({ summary: 'Send forgot password code to user' })
  @ApiBody({
    description: 'Request body for sending a forgot password code',
    type: SendForgotPasswordCodeDto,
    examples: {
      example1: {
        summary: 'Valid Request Example',
        description:
          'Example of a valid request to send a forgot password code',
        value: {
          email: 'user@example.com',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Forgot password email sent successfully',
    schema: {
      example: { message: 'Forgot password email sent successfully' },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User with this email does not exist',
    schema: {
      example: {
        statusCode: 404,
        message: 'User with this email does not exist.',
      },
    },
  })
  async sendForgotPasswordCode(
    @Body() sendForgotPasswordCodeDto: SendForgotPasswordCodeDto,
  ): Promise<{ message: string }> {
    return this.usersService.sendForgotPasswordCode(sendForgotPasswordCodeDto);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Validate reset code and reset password' })
  @ApiBody({
    description:
      'Request body for validating reset code and resetting the password',
    type: ValidateResetCodeAndResetPasswordDto,
    examples: {
      example1: {
        summary: 'Valid Reset Request Example',
        description: 'Example of a valid reset code and password reset request',
        value: {
          email: 'user@example.com',
          resetCode: '1234',
          newPassword: 'NewSecurePassword123',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Password reset successfully',
    schema: {
      example: { message: 'Password reset successfully' },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid reset code or reset code has expired',
    schema: {
      example: { statusCode: 400, message: 'Invalid reset code.' },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found',
    schema: {
      example: { statusCode: 404, message: 'User not found.' },
    },
  })
  async validateResetCodeAndResetPassword(
    @Body()
    validateResetCodeAndResetPasswordDto: ValidateResetCodeAndResetPasswordDto,
  ): Promise<{ message: string }> {
    return this.usersService.validateResetCodeAndResetPassword(
      validateResetCodeAndResetPasswordDto,
    );
  }

  @Post('verify')
  @ApiOperation({ summary: 'Account verification' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Account verified successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid verification code or email',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found',
  })
  async verifyAccount(
    @Body() verifyAccountDto: VerifyAccountDto,
  ): Promise<{ message: string }> {
    return this.usersService.verifyAccount(verifyAccountDto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Put('profile_picture/:userId')
  @ApiOperation({ summary: 'Upload profile picture' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Picture uploaded successfully',
    schema: {
      example: {
        message: 'Picture uploaded successfully',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid file or upload error',
    schema: {
      example: {
        statusCode: 400,
        message: 'File format not supported',
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  uploadVerifications(@Req() req, @UploadedFile() file: any) {
    const userFromJwt = req.user as User;
    return this.usersService.uploadUserFile(userFromJwt.id, file);
  }



  @Post('mock-ngos')
  async createMockNgos(): Promise<{ message: string; count: number }> {
    try {
      const mockUsers = await this.userRepo.createMockUsers();
      return {
        message: 'Mock NGO users created successfully',
        count: mockUsers.length,
      };
    } catch (error) {
      throw new HttpException(
        'Failed to create mock NGO users',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
