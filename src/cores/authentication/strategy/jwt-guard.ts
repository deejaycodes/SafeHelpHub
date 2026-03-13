import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TokenBlacklistService } from '../token-blacklist.service';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly tokenBlacklist: TokenBlacklistService) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization?.replace('Bearer ', '');

    if (token && this.tokenBlacklist.isBlacklisted(token)) {
      throw new UnauthorizedException('Token has been invalidated');
    }

    return super.canActivate(context);
  }

  handleRequest(err, user) {
    if (err) {
      throw err;
    }
    return user || null;
  }
}
