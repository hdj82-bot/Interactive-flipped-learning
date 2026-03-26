import { IsString, IsInt, Min } from 'class-validator';

export class CreateSessionDto {
  @IsString()
  lectureId!: string;

  @IsInt()
  @Min(1)
  totalSec!: number;
}
