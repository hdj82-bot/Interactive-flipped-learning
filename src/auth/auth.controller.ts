import {
  Controller,
  Get,
  Post,
  Delete,
  Query,
  Body,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { CompleteProfileDto } from './dto/complete-profile.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  /** Google OAuth 로그인 시작 */
  @Get('google')
  async googleLogin(@Query('role') role: string, @Res() res: Response) {
    const url = await this.auth.getGoogleAuthUrl(role);
    return res.redirect(url);
  }

  /** Google OAuth 콜백 */
  @Get('google/callback')
  async googleCallback(
    @Query('code') code: string,
    @Query('state') state: string,
  ) {
    return this.auth.handleGoogleCallback(code, state);
  }

  /** 신규 사용자 프로필 완성 */
  @Post('complete-profile')
  async completeProfile(@Body() dto: CompleteProfileDto) {
    return this.auth.completeProfile(dto);
  }

  /** Access Token 갱신 */
  @Post('refresh')
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.auth.refresh(dto.refreshToken);
  }

  /** 로그아웃 (Refresh Token 무효화) */
  @Delete('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Body() dto: RefreshTokenDto) {
    await this.auth.logout(dto.refreshToken);
  }

  /** 현재 사용자 정보 (인증 확인용) */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: { userId: string; role: string }) {
    return user;
  }
}
