import { IsEnum, IsOptional, IsInt, IsNumber, IsString, Min, Max } from 'class-validator';
import { SessionStatus } from '@prisma/client';

export class UpdateSessionDto {
  @IsEnum(SessionStatus)
  status!: SessionStatus;

  @IsOptional()
  @IsInt()
  @Min(0)
  watchedSec?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  progressPct?: number;

  @IsOptional()
  @IsString()
  pauseReason?: string;
}
