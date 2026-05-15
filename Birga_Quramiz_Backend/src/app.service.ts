import {
  Injectable,
  ServiceUnavailableException,
  BeforeApplicationShutdown,
} from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class AppService implements BeforeApplicationShutdown {
  private shuttingDown = false;

  constructor(private readonly prisma: PrismaService) {}

  beforeApplicationShutdown() {
    this.shuttingDown = true;
  }

  getHello(): string {
    return 'Birga Quramiz API';
  }

  /** Liveness probe — always returns 200 if the process is alive */
  async getHealth() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'ok',
        database: 'connected',
        timestamp: new Date().toISOString(),
      };
    } catch {
      throw new ServiceUnavailableException({
        status: 'error',
        database: 'disconnected',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /** Readiness probe — returns 503 during graceful shutdown so load balancers stop sending traffic */
  getReadiness() {
    if (this.shuttingDown) {
      throw new ServiceUnavailableException({ status: 'shutting_down' });
    }
    return { status: 'ready', timestamp: new Date().toISOString() };
  }
}
