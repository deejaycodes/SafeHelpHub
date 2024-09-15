import * as dotenv from 'dotenv';
dotenv.config();

import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(public configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_KEY'),
    });
  }

  async validate(payload: any) {
    try {
      const username = payload.username;
      const id = payload.id;
      const role = payload.role

      return { username, id, role};
    } catch (error) {
      throw new Error(`Error validating JWT payload: ${error.message}`);
    }
  }
}
