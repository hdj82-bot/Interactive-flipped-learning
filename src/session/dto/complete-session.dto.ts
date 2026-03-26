import { IsOptional, IsInt, Min } from 'class-validator';

export class CompleteSessionDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  watchedSec?: number;
}
