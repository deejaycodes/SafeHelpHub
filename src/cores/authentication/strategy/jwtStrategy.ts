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
      secretOrKey: configService.get('JWT_KEY') || 'sporty_secretKey_for_sure',
    });
  }

  async validate(payload: any) {
    try {
      const username = payload.username;
      const ngo_name = payload.ngo;
      const admin_name = payload.admin_name;
      const id = payload.id;
      const role = payload.role;
      const email = payload.email;

      return { username, id, role, ngo_name, admin_name, email };
    } catch (error) {
      throw new Error(`Error validating JWT payload: ${error.message}`);
    }
  }
}
