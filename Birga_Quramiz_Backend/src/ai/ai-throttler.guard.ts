import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { Request } from 'express';
import type { AuthUser } from '../auth/auth.types';

// Guests: 5 requests/min (per IP)
// Authenticated users: 20 requests/min (per userId)
@Injectable()
export class AiThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Request & { user?: AuthUser }): Promise<string> {
    if (req.user?.id) return `ai:user:${req.user.id}`;
    const ip = req.ip ?? req.socket?.remoteAddress ?? 'unknown';
    return `ai:ip:${ip}`;
  }

  protected getLimit(context: ExecutionContext): Promise<number> {
    const req = context.switchToHttp().getRequest<Request & { user?: AuthUser }>();
    return Promise.resolve(req.user?.id ? 20 : 5);
  }

  protected getTtl(): Promise<number> {
    return Promise.resolve(60000);
  }
}
