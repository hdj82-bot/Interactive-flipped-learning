import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { SessionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { CompleteSessionDto } from './dto/complete-session.dto';
import { canTransition, getAllowedTransitions } from './session-state';

@Injectable()
export class SessionService {
  constructor(private readonly prisma: PrismaService) {}

  /** 세션 시작 — POST /api/sessions */
  async create(userId: string, dto: CreateSessionDto) {
    return this.prisma.sessionLog.create({
      data: {
        userId,
        lectureId: dto.lectureId,
        totalSec: dto.totalSec,
        status: SessionStatus.IN_PROGRESS,
        startedAt: new Date(),
        lastActiveAt: new Date(),
      },
    });
  }

  /** 세션 상태 업데이트 — PATCH /api/sessions/:id */
  async update(userId: string, sessionId: string, dto: UpdateSessionDto) {
    const session = await this.findOwnedSession(userId, sessionId);

    if (!canTransition(session.status, dto.status)) {
      const allowed = getAllowedTransitions(session.status);
      throw new BadRequestException(
        `${session.status} → ${dto.status} 전환 불가. 가능한 상태: [${allowed.join(', ')}]`,
      );
    }

    const data: Record<string, unknown> = {
      status: dto.status,
      lastActiveAt: new Date(),
    };

    // 네트워크 단절 → PAUSED
    if (dto.status === SessionStatus.PAUSED) {
      data.pauseReason = dto.pauseReason ?? 'network_disconnect';
    }

    // PAUSED → IN_PROGRESS 재연결 시 타이머 리셋 (lastActiveAt 갱신)
    if (session.status === SessionStatus.PAUSED && dto.status === SessionStatus.IN_PROGRESS) {
      data.pauseReason = null;
    }

    // QA_MODE에서 무반응 시 카운트 증가
    if (
      session.status === SessionStatus.QA_MODE &&
      dto.status === SessionStatus.IN_PROGRESS &&
      dto.pauseReason === 'no_response'
    ) {
      data.noResponseCnt = session.noResponseCnt + 1;
    }

    if (dto.watchedSec !== undefined) data.watchedSec = dto.watchedSec;
    if (dto.progressPct !== undefined) data.progressPct = dto.progressPct;

    return this.prisma.sessionLog.update({
      where: { id: sessionId },
      data,
    });
  }

  /** 세션 완료 — POST /api/sessions/:id/complete */
  async complete(userId: string, sessionId: string, dto: CompleteSessionDto) {
    const session = await this.findOwnedSession(userId, sessionId);

    if (!canTransition(session.status, SessionStatus.COMPLETED)) {
      throw new BadRequestException(
        `${session.status} 상태에서는 완료 처리할 수 없습니다. IN_PROGRESS 또는 ASSESSMENT 상태여야 합니다`,
      );
    }

    return this.prisma.sessionLog.update({
      where: { id: sessionId },
      data: {
        status: SessionStatus.COMPLETED,
        progressPct: 100,
        watchedSec: dto.watchedSec ?? session.watchedSec,
        completedAt: new Date(),
        lastActiveAt: new Date(),
      },
    });
  }

  /** 내 세션 조회 */
  async findById(userId: string, sessionId: string) {
    return this.findOwnedSession(userId, sessionId);
  }

  /** 내 세션 목록 */
  async findMySession(userId: string, lectureId?: string) {
    return this.prisma.sessionLog.findMany({
      where: { userId, ...(lectureId ? { lectureId } : {}) },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── private ──

  private async findOwnedSession(userId: string, sessionId: string) {
    const session = await this.prisma.sessionLog.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException('세션을 찾을 수 없습니다');
    }

    if (session.userId !== userId) {
      throw new ForbiddenException('본인의 세션만 접근할 수 있습니다');
    }

    return session;
  }
}
