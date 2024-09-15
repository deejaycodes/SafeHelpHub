import { Body, Controller, Post, Res, UseGuards,  Request, } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dtos/createUserDto';
import { UserResponseDto } from './dtos/userResponseDto';
import { LocalAuthGuard } from './strategy/local-auth-strategy';
import { JwtService } from '@nestjs/jwt';

@Controller('users')
export class UsersController {
    constructor(private readonly userService: UsersService,
      private jwtService: JwtService
    ) {}

    @Post('register')
    async createUser(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    return this.userService.createUser(createUserDto);
   }

   @UseGuards(LocalAuthGuard)
   @Post('login')
   async login(@Request() req, @Res({ passthrough: true }) response?: Response) {

    const payload = {
      id:req.user.id,
        username:req.user.username,
        role:req.user.role,
        created_at: req.user.created_at,
        updated_at: req.user.updated_at,
    }
    return {
        ...payload,
        token:  this.jwtService.sign(payload, {
          secret: process.env.JWT_KEY 
        })
    }
  }

}
