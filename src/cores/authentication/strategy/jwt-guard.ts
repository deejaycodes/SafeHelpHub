// jwt-auth.guard.ts
import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err, user) {
    if (err) {
      throw err;
    }
    return user || null;
  }
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }
}
