import { Body, Controller, HttpCode, Post, HttpException, HttpStatus, UseGuards, Req, Logger } from '@nestjs/common';
import { AiService, ChatMessage } from './ai.service';
import { ArrayMinSize, IsArray, IsIn, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { AiThrottlerGuard } from './ai-throttler.guard';
import type { AuthUser } from '../auth/auth.types';
import type { Request } from 'express';

class MessageDto {
  @IsIn(['user', 'assistant'])
  role!: 'user' | 'assistant';

  @IsString()
  @MaxLength(2000)
  content!: string;
}

class ChatDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => MessageDto)
  messages!: ChatMessage[];

  @IsOptional()
  @IsString()
  @IsIn(['ru', 'uz', 'en'])
  locale?: string;

  @IsOptional()
  projectContext?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  sessionId?: string;
}

@Controller('ai')
@UseGuards(OptionalJwtAuthGuard, AiThrottlerGuard)
export class AiController {
  private readonly logger = new Logger('AiChat');

  constructor(private readonly aiService: AiService) {}

  @Post('chat')
  @HttpCode(200)
  async chat(@Body() body: ChatDto, @Req() req: Request & { user?: AuthUser }) {
    if (!process.env.GEMINI_API_KEY) {
      throw new HttpException('AI service not configured', HttpStatus.SERVICE_UNAVAILABLE);
    }

    const session = body.sessionId ?? 'unknown';
    const msgCount = body.messages.length;
    const userId = req.user?.id;
    const ip = req.ip ?? req.socket?.remoteAddress ?? 'unknown';
    const trackingKey = userId ? `user:${userId}` : `ip:${ip}`;
    this.logger.log(`session=${session} key=${trackingKey} msgs=${msgCount} locale=${body.locale ?? 'ru'}`);

    try {
      const reply = await this.aiService.chat(
        body.messages,
        body.locale ?? 'ru',
        body.projectContext,
        trackingKey,
        !!userId,
      );

      const cartAction = reply.actions?.find((a) => a.type === 'add_to_cart');
      if (cartAction) {
        this.logger.log(`session=${session} CART_ACTION products=${reply.products?.length ?? 0}`);
      }

      return reply;
    } catch (err) {
      const isTimeout = err instanceof Error && err.message.includes('timed out');
      const isQuota = err instanceof HttpException && err.getStatus() === HttpStatus.TOO_MANY_REQUESTS;
      if (!isQuota) {
        this.logger.error(`session=${session} key=${trackingKey} error=${isTimeout ? 'TIMEOUT' : String(err)}`);
      }
      throw err;
    }
  }
}
