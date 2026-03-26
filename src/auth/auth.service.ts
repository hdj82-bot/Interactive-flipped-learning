import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { RedisService } from '../redis/redis.service';
import { UserService } from '../user/user.service';
import { CompleteProfileDto } from './dto/complete-profile.dto';

interface GoogleUserInfo {
  sub: string;
  email: string;
  name: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
}

@Injectable()
export class AuthService {
  private readonly googleClientId: string;
  private readonly googleClientSecret: string;
  private readonly googleCallbackUrl: string;
  private readonly accessExpMin: number;
  private readonly refreshExpDays: number;

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly redis: RedisService,
    private readonly userService: UserService,
  ) {
    this.googleClientId = this.config.get<string>('GOOGLE_CLIENT_ID', '');
    this.googleClientSecret = this.config.get<string>('GOOGLE_CLIENT_SECRET', '');
    this.googleCallbackUrl = this.config.get<string>('GOOGLE_CALLBACK_URL', '');
    this.accessExpMin = this.config.get<number>('ACCESS_TOKEN_EXPIRE_MINUTES', 15);
    this.refreshExpDays = this.config.get<number>('REFRESH_TOKEN_EXPIRE_DAYS', 7);
  }

  /** Google OAuth 인증 URL 생성 */
  async getGoogleAuthUrl(role: string): Promise<string> {
    if (role !== 'professor' && role !== 'student') {
      throw new BadRequestException('role은 professor 또는 student여야 합니다');
    }

    const state = uuidv4();
    await this.redis.saveOAuthState(state, role);

    const params = new URLSearchParams({
      client_id: this.googleClientId,
      redirect_uri: this.googleCallbackUrl,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      state,
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  /** Google OAuth 콜백 처리 */
  async handleGoogleCallback(code: string, state: string) {
    const role = await this.redis.popOAuthState(state);
    if (!role) {
      throw new BadRequestException('유효하지 않거나 만료된 OAuth state입니다');
    }

    const userInfo = await this.exchangeCodeForUserInfo(code);
    const existingUser = await this.userService.findByGoogleSub(userInfo.sub);

    if (existingUser) {
      const tokens = await this.issueTokens(existingUser.id, existingUser.role);
      return { status: 'authenticated', ...tokens };
    }

    const tempToken = this.createTempToken(userInfo.sub, userInfo.email, userInfo.name, role);
    return {
      status: 'needs_profile',
      tempToken,
      role,
      email: userInfo.email,
      name: userInfo.name,
    };
  }

  /** 신규 사용자 프로필 완성 후 토큰 발급 */
  async completeProfile(dto: CompleteProfileDto): Promise<TokenPair> {
    const payload = this.verifyTempToken(dto.tempToken);

    if (dto.role === 'professor') {
      if (!dto.school || !dto.department) {
        throw new BadRequestException('교수자는 학교명과 소속학과를 입력해야 합니다');
      }
    } else if (dto.role === 'student') {
      if (!dto.studentNumber) {
        throw new BadRequestException('학습자는 학번을 입력해야 합니다');
      }
    }

    const user = await this.userService.createFromGoogle({
      email: payload.email as string,
      name: payload.name as string,
      googleSub: payload.sub as string,
      role: dto.role as UserRole,
      school: dto.school,
      department: dto.department,
      studentNumber: dto.studentNumber,
    });

    return this.issueTokens(user.id, user.role);
  }

  /** Refresh Token으로 새 토큰 쌍 발급 (rotation) */
  async refresh(refreshToken: string): Promise<TokenPair> {
    const payload = this.verifyToken(refreshToken);

    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('유효한 Refresh Token이 아닙니다');
    }

    const valid = await this.redis.validateAndDeleteRefreshToken(
      payload.jti as string,
      payload.sub as string,
    );
    if (!valid) {
      throw new UnauthorizedException('이미 사용되었거나 만료된 Refresh Token입니다');
    }

    return this.issueTokens(payload.sub as string, payload.role as UserRole);
  }

  /** 로그아웃 (Refresh Token 무효화) */
  async logout(refreshToken: string): Promise<void> {
    try {
      const payload = this.verifyToken(refreshToken);
      if (payload.type === 'refresh' && payload.jti) {
        await this.redis.deleteRefreshToken(payload.jti as string);
      }
    } catch {
      // 이미 만료된 토큰으로 로그아웃해도 에러 없이 처리
    }
  }

  // ── private helpers ──

  private async issueTokens(userId: string, role: UserRole): Promise<TokenPair> {
    const accessJti = uuidv4();
    const refreshJti = uuidv4();

    const accessToken = this.jwt.sign(
      { sub: userId, role, type: 'access', jti: accessJti },
      { expiresIn: `${this.accessExpMin}m` },
    );

    const refreshExpSeconds = this.refreshExpDays * 24 * 60 * 60;
    const refreshToken = this.jwt.sign(
      { sub: userId, role, type: 'refresh', jti: refreshJti },
      { expiresIn: `${this.refreshExpDays}d` },
    );

    await this.redis.saveRefreshToken(refreshJti, userId, refreshExpSeconds);

    return { accessToken, refreshToken, tokenType: 'Bearer' };
  }

  private createTempToken(
    googleSub: string,
    email: string,
    name: string,
    role: string,
  ): string {
    return this.jwt.sign(
      { sub: googleSub, email, name, role, type: 'temp', jti: uuidv4() },
      { expiresIn: '10m' },
    );
  }

  private verifyTempToken(token: string): Record<string, unknown> {
    const payload = this.verifyToken(token);
    if (payload.type !== 'temp') {
      throw new UnauthorizedException('유효한 임시 토큰이 아닙니다');
    }
    return payload;
  }

  private verifyToken(token: string): Record<string, unknown> {
    try {
      return this.jwt.verify(token);
    } catch {
      throw new UnauthorizedException('토큰이 유효하지 않거나 만료되었습니다');
    }
  }

  private async exchangeCodeForUserInfo(code: string): Promise<GoogleUserInfo> {
    // 1. code → access_token 교환
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: this.googleClientId,
        client_secret: this.googleClientSecret,
        redirect_uri: this.googleCallbackUrl,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenRes.ok) {
      throw new BadRequestException('Google 인증 코드 교환에 실패했습니다');
    }

    const tokenData = await tokenRes.json();

    // 2. access_token → 사용자 정보 조회
    const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!userRes.ok) {
      throw new BadRequestException('Google 사용자 정보 조회에 실패했습니다');
    }

    const userInfo = await userRes.json();
    return { sub: userInfo.sub, email: userInfo.email, name: userInfo.name };
  }
}
