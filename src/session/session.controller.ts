import {
  Controller,
  Post,
  Patch,
  Get,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SessionService } from './session.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { CompleteSessionDto } from './dto/complete-session.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../common/enums/role.enum';

@Controller('sessions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.STUDENT)
export class SessionController {
  constructor(private readonly session: SessionService) {}

  /** 세션 시작 */
  @Post()
  create(
    @CurrentUser() user: { userId: string },
    @Body() dto: CreateSessionDto,
  ) {
    return this.session.create(user.userId, dto);
  }

  /** 세션 상태 업데이트 */
  @Patch(':id')
  update(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
    @Body() dto: UpdateSessionDto,
  ) {
    return this.session.update(user.userId, id, dto);
  }

  /** 세션 완료 처리 */
  @Post(':id/complete')
  complete(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
    @Body() dto: CompleteSessionDto,
  ) {
    return this.session.complete(user.userId, id, dto);
  }

  /** 세션 단건 조회 */
  @Get(':id')
  findOne(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
  ) {
    return this.session.findById(user.userId, id);
  }

  /** 내 세션 목록 조회 */
  @Get()
  findMy(
    @CurrentUser() user: { userId: string },
    @Query('lectureId') lectureId?: string,
  ) {
    return this.session.findMySession(user.userId, lectureId);
  }
}
