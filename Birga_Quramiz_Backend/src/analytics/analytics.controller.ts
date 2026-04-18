import { Body, Controller, HttpCode, Logger, Post, UseGuards } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { IsOptional, IsString } from 'class-validator';

class EventDto {
  @IsString()
  event!: string;

  @IsOptional()
  @IsString()
  sessionId?: string;

  @IsOptional()
  @IsString()
  orderId?: string;

  @IsOptional()
  itemCount?: number;
}

@Controller('analytics')
@UseGuards(ThrottlerGuard)
export class AnalyticsController {
  private readonly logger = new Logger('Analytics');

  @Post('event')
  @HttpCode(204)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  log(@Body() body: EventDto) {
    const parts = [`event=${body.event}`];
    if (body.sessionId) parts.push(`session=${body.sessionId}`);
    if (body.orderId) parts.push(`order=${body.orderId}`);
    if (body.itemCount !== undefined) parts.push(`items=${body.itemCount}`);
    this.logger.log(parts.join(' '));
  }
}
