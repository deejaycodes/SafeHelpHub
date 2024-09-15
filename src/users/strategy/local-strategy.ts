import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { LoginDto } from '../dtos/loginDto';
import { UsersService } from '../users.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private usersService: UsersService) {
    super();
  }

  async validate(username:string, password:string): Promise<any> {
    const user = await this.usersService.validate(username, password);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
