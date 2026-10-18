import { Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import {
  CommitmentKind,
  RuleFrequency,
} from '../../generated/prisma/client.js';

const DATE = /^\d{4}-\d{2}-\d{2}$/;

export class CreateCommitmentDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsEnum(CommitmentKind)
  kind!: CommitmentKind;

  @Matches(DATE, { message: 'startDate must be an ISO calendar date.' })
  startDate!: string;

  @Matches(DATE, { message: 'endDate must be an ISO calendar date.' })
  endDate!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  timeZone!: string;

  @IsEnum(RuleFrequency)
  ruleFrequency!: RuleFrequency;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(31)
  targetCount!: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(365)
  windowDays?: number;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @Type(() => Number)
  @IsInt({ each: true })
  @Min(1, { each: true })
  @Max(7, { each: true })
  scheduledDays?: number[];

  @IsString()
  @MinLength(1)
  @MaxLength(160)
  reward!: string;
}
