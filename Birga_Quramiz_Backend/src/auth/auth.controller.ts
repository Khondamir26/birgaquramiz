import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Req,
} from '@nestjs/common'
import { AuthService } from './auth.service'
import { JwtAuthGuard } from './jwt-auth.guard'
import type { Request } from 'express'

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  register(
    @Body('name') name: string,
    @Body('phone') phone: string,
    @Body('password') password: string,
  ) {
    return this.authService.register(name, phone, password)
  }

  @Post('login')
  login(
    @Body('phone') phone: string,
    @Body('password') password: string,
  ) {
    return this.authService.login(phone, password)
  }

  // 🔐 Protected route
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  getProfile(@Req() req: Request) {
    return req['user']
  }
}