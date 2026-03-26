import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/role.enum';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.PROFESSOR)
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  /** 출석 분석 (실시간 vs 사후 시청) */
  @Get(':lectureId/attendance')
  getAttendance(
    @Param('lectureId') lectureId: string,
    @Query('liveDeadlineMin') liveDeadlineMin?: string,
  ) {
    const deadlineMin = liveDeadlineMin ? parseInt(liveDeadlineMin, 10) : 30;
    return this.dashboard.getAttendance(lectureId, deadlineMin);
  }

  /** 정답률·오답 유형 분석 */
  @Get(':lectureId/scores')
  getScores(@Param('lectureId') lectureId: string) {
    return this.dashboard.getScores(lectureId);
  }

  /** 참여도 (역질문 반응률·무반응 기록) */
  @Get(':lectureId/engagement')
  getEngagement(@Param('lectureId') lectureId: string) {
    return this.dashboard.getEngagement(lectureId);
  }

  /** Q&A 로그 조회 */
  @Get(':lectureId/qa')
  getQALogs(
    @Param('lectureId') lectureId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const p = page ? parseInt(page, 10) : 1;
    const l = limit ? parseInt(limit, 10) : 50;
    return this.dashboard.getQALogs(lectureId, p, l);
  }

  /** 비용 미터 (CostLog 합산) */
  @Get(':lectureId/cost')
  getCost(@Param('lectureId') lectureId: string) {
    return this.dashboard.getCost(lectureId);
  }
}
