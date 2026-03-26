import { IsString, IsOptional, IsEnum } from 'class-validator';
import { UserRole } from '../../common/enums/role.enum';

export class CompleteProfileDto {
  @IsString()
  tempToken!: string;

  @IsEnum(UserRole)
  role!: UserRole;

  /** 교수자 전용: 학교명 */
  @IsOptional()
  @IsString()
  school?: string;

  /** 교수자 전용: 소속학과 */
  @IsOptional()
  @IsString()
  department?: string;

  /** 학습자 전용: 학번 */
  @IsOptional()
  @IsString()
  studentNumber?: string;
}
