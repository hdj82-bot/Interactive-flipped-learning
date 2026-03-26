import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 출석 분석
   * - 실시간(live): 강의 생성 후 liveDeadlineMin 이내에 세션 시작
   * - 사후(vod): 그 이후 시청
   * - 미참여: 세션 기록 없음
   */
  async getAttendance(lectureId: string, liveDeadlineMin: number) {
    const sessions = await this.prisma.sessionLog.findMany({
      where: { lectureId },
      include: { user: { select: { id: true, name: true, email: true, studentNumber: true } } },
      orderBy: { startedAt: 'asc' },
    });

    if (sessions.length === 0) {
      return { lectureId, summary: { total: 0, live: 0, vod: 0 }, students: [] };
    }

    // 가장 빠른 세션 시작 시점을 강의 시작 기준으로 사용
    const earliest = sessions.reduce(
      (min, s) => (s.startedAt && s.startedAt < min ? s.startedAt : min),
      sessions[0].startedAt ?? sessions[0].createdAt,
    );
    const liveDeadline = new Date(earliest.getTime() + liveDeadlineMin * 60 * 1000);

    const students = sessions.map((s) => {
      const isLive = s.startedAt ? s.startedAt <= liveDeadline : false;
      return {
        userId: s.user.id,
        name: s.user.name,
        studentNumber: s.user.studentNumber,
        type: isLive ? 'live' as const : 'vod' as const,
        startedAt: s.startedAt,
        progressPct: s.progressPct,
        status: s.status,
      };
    });

    const live = students.filter((s) => s.type === 'live').length;
    const vod = students.filter((s) => s.type === 'vod').length;

    return {
      lectureId,
      liveDeadline,
      summary: { total: students.length, live, vod },
      students,
    };
  }

  /**
   * 정답률·오답 유형 분석
   * - 전체 정답률
   * - 문제 유형별 정답률
   * - 카테고리별 정답률
   * - 오답 빈도 TOP 문항
   */
  async getScores(lectureId: string) {
    const results = await this.prisma.assessmentResult.findMany({
      where: { lectureId },
      include: { user: { select: { id: true, name: true, studentNumber: true } } },
    });

    if (results.length === 0) {
      return {
        lectureId,
        totalQuestions: 0,
        overallAccuracy: 0,
        byType: [],
        byCategory: [],
        wrongAnswerTop: [],
      };
    }

    const total = results.length;
    const correct = results.filter((r) => r.isCorrect).length;

    // 유형별 정답률
    const typeMap = new Map<string, { total: number; correct: number }>();
    for (const r of results) {
      const entry = typeMap.get(r.questionType) ?? { total: 0, correct: 0 };
      entry.total++;
      if (r.isCorrect) entry.correct++;
      typeMap.set(r.questionType, entry);
    }
    const byType = [...typeMap.entries()].map(([type, v]) => ({
      type,
      total: v.total,
      correct: v.correct,
      accuracy: Math.round((v.correct / v.total) * 10000) / 100,
    }));

    // 카테고리별 정답률
    const catMap = new Map<string, { total: number; correct: number }>();
    for (const r of results) {
      const cat = r.category ?? 'uncategorized';
      const entry = catMap.get(cat) ?? { total: 0, correct: 0 };
      entry.total++;
      if (r.isCorrect) entry.correct++;
      catMap.set(cat, entry);
    }
    const byCategory = [...catMap.entries()].map(([category, v]) => ({
      category,
      total: v.total,
      correct: v.correct,
      accuracy: Math.round((v.correct / v.total) * 10000) / 100,
    }));

    // 오답 빈도 TOP 문항
    const wrongMap = new Map<string, { questionText: string; questionType: string; wrongCount: number; wrongAnswers: string[] }>();
    for (const r of results) {
      if (r.isCorrect) continue;
      const key = r.questionText;
      const entry = wrongMap.get(key) ?? {
        questionText: r.questionText,
        questionType: r.questionType,
        wrongCount: 0,
        wrongAnswers: [],
      };
      entry.wrongCount++;
      if (!entry.wrongAnswers.includes(r.userAnswer)) {
        entry.wrongAnswers.push(r.userAnswer);
      }
      wrongMap.set(key, entry);
    }
    const wrongAnswerTop = [...wrongMap.values()]
      .sort((a, b) => b.wrongCount - a.wrongCount)
      .slice(0, 10);

    return {
      lectureId,
      totalQuestions: total,
      overallAccuracy: Math.round((correct / total) * 10000) / 100,
      byType,
      byCategory,
      wrongAnswerTop,
    };
  }

  /**
   * 참여도 분석
   * - 역질문 반응률 (Q&A에서 responded 비율)
   * - 무반응 기록 (세션별 noResponseCnt)
   * - 학생별 참여도 점수
   */
  async getEngagement(lectureId: string) {
    const [sessions, qaLogs] = await Promise.all([
      this.prisma.sessionLog.findMany({
        where: { lectureId },
        include: { user: { select: { id: true, name: true, studentNumber: true } } },
      }),
      this.prisma.qALog.findMany({
        where: { lectureId },
      }),
    ]);

    // Q&A 반응률
    const totalQA = qaLogs.length;
    const respondedQA = qaLogs.filter((q) => q.responded).length;

    // 학생별 참여도
    const studentMap = new Map<string, {
      userId: string;
      name: string;
      studentNumber: string | null;
      qaCount: number;
      respondedCount: number;
      noResponseCnt: number;
      watchedSec: number;
      totalSec: number;
    }>();

    for (const s of sessions) {
      const entry = studentMap.get(s.userId) ?? {
        userId: s.user.id,
        name: s.user.name,
        studentNumber: s.user.studentNumber,
        qaCount: 0,
        respondedCount: 0,
        noResponseCnt: 0,
        watchedSec: 0,
        totalSec: 0,
      };
      entry.noResponseCnt += s.noResponseCnt;
      entry.watchedSec += s.watchedSec;
      entry.totalSec += s.totalSec;
      studentMap.set(s.userId, entry);
    }

    for (const q of qaLogs) {
      const entry = studentMap.get(q.userId);
      if (!entry) continue;
      entry.qaCount++;
      if (q.responded) entry.respondedCount++;
    }

    const totalNoResponse = sessions.reduce((sum, s) => sum + s.noResponseCnt, 0);

    const students = [...studentMap.values()].map((s) => ({
      ...s,
      responseRate: s.qaCount > 0
        ? Math.round((s.respondedCount / s.qaCount) * 10000) / 100
        : null,
      watchRatio: s.totalSec > 0
        ? Math.round((s.watchedSec / s.totalSec) * 10000) / 100
        : 0,
    }));

    return {
      lectureId,
      summary: {
        totalStudents: sessions.length,
        totalQAQuestions: totalQA,
        overallResponseRate: totalQA > 0
          ? Math.round((respondedQA / totalQA) * 10000) / 100
          : 0,
        totalNoResponseEvents: totalNoResponse,
      },
      students,
    };
  }

  /** Q&A 로그 조회 (페이지네이션) */
  async getQALogs(lectureId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      this.prisma.qALog.findMany({
        where: { lectureId },
        include: { user: { select: { id: true, name: true, studentNumber: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.qALog.count({ where: { lectureId } }),
    ]);

    return {
      lectureId,
      page,
      limit,
      totalCount: total,
      totalPages: Math.ceil(total / limit),
      logs,
    };
  }

  /**
   * 비용 미터 (CostLog 합산)
   * - 카테고리별 비용 합산
   * - 토큰 사용량 합산
   * - 전체 합계
   */
  async getCost(lectureId: string) {
    const costs = await this.prisma.costLog.findMany({
      where: { lectureId },
      orderBy: { createdAt: 'desc' },
    });

    // 카테고리별 합산
    const byCategoryMap = new Map<string, {
      category: string;
      inputTokens: number;
      outputTokens: number;
      costUsd: number;
      count: number;
    }>();

    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let totalCostUsd = 0;

    for (const c of costs) {
      totalInputTokens += c.inputTokens;
      totalOutputTokens += c.outputTokens;
      totalCostUsd += c.costUsd;

      const entry = byCategoryMap.get(c.category) ?? {
        category: c.category,
        inputTokens: 0,
        outputTokens: 0,
        costUsd: 0,
        count: 0,
      };
      entry.inputTokens += c.inputTokens;
      entry.outputTokens += c.outputTokens;
      entry.costUsd += c.costUsd;
      entry.count++;
      byCategoryMap.set(c.category, entry);
    }

    const byCategory = [...byCategoryMap.values()].map((e) => ({
      ...e,
      costUsd: Math.round(e.costUsd * 1_000_000) / 1_000_000,
    }));

    return {
      lectureId,
      summary: {
        totalRequests: costs.length,
        totalInputTokens,
        totalOutputTokens,
        totalCostUsd: Math.round(totalCostUsd * 1_000_000) / 1_000_000,
      },
      byCategory,
      recentLogs: costs.slice(0, 20),
    };
  }
}
