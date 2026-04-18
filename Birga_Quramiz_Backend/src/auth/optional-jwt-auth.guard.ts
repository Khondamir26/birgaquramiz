import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Allows both authenticated and guest users.
// If token present and valid → req.user is populated.
// If token missing or invalid → req.user stays undefined (no 401).
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<T>(_err: unknown, user: T): T {
    return user;
  }

  canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<{ headers: Record<string, string> }>();
    if (!req.headers['authorization']) return true;
    return super.canActivate(context);
  }
}
