import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  /** Liveness probe — process is alive */
  @Get('health')
  getHealth() {
    return this.appService.getHealth();
  }

  /** Readiness probe — process is ready to receive traffic (503 during shutdown) */
  @Get('health/ready')
  getReadiness() {
    return this.appService.getReadiness();
  }
}
