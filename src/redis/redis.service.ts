import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly client: Redis;

  constructor(private readonly config: ConfigService) {
    this.client = new Redis(this.config.get<string>('REDIS_URL', 'redis://localhost:6379/0'));
  }

  async onModuleDestroy() {
    await this.client.quit();
  }

  /** OAuth state 저장 (CSRF 방지, 10분 TTL) */
  async saveOAuthState(state: string, role: string): Promise<void> {
    await this.client.setex(`oauth_state:${state}`, 600, role);
  }

  /** OAuth state 꺼내기 (1회성) */
  async popOAuthState(state: string): Promise<string | null> {
    const key = `oauth_state:${state}`;
    const role = await this.client.get(key);
    if (role) await this.client.del(key);
    return role;
  }

  /** Refresh Token 저장 */
  async saveRefreshToken(jti: string, userId: string, ttlSeconds: number): Promise<void> {
    await this.client.setex(`rt:${jti}`, ttlSeconds, userId);
  }

  /** Refresh Token 검증 후 삭제 (rotation) */
  async validateAndDeleteRefreshToken(jti: string, userId: string): Promise<boolean> {
    const key = `rt:${jti}`;
    const stored = await this.client.get(key);
    if (stored !== userId) return false;
    await this.client.del(key);
    return true;
  }

  /** Refresh Token 삭제 (logout) */
  async deleteRefreshToken(jti: string): Promise<void> {
    await this.client.del(`rt:${jti}`);
  }
}
