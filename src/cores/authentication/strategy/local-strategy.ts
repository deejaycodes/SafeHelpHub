import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthenticationService } from '../authentication.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthenticationService) {
    super();
  }

  async validate(username: string, password: string): Promise<any> {
    const lowerCaseEmail = username.toLowerCase();
    const user = await this.authService.validate(lowerCaseEmail, password);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
