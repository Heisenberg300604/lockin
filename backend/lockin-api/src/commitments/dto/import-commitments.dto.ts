import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import {
  CheckInOutcome,
  CommitmentKind,
  CommitmentStatus,
  RuleFrequency,
} from '../../generated/prisma/client.js';

const DATE = /^\d{4}-\d{2}-\d{2}$/;

export class LegacyCheckInDto {
  @Matches(DATE, { message: 'date must be an ISO calendar date.' })
  date!: string;

  @IsEnum(CheckInOutcome)
  outcome!: CheckInOutcome;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  reason?: string;

  @IsOptional()
  @IsDateString()
  createdAt?: string;

  @IsOptional()
  @IsDateString()
  updatedAt?: string;
}

export class LegacyCommitmentDto {
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  legacyId!: string;

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

  @Matches(DATE)
  startDate!: string;

  @Matches(DATE)
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

  @IsEnum(CommitmentStatus)
  status!: CommitmentStatus;

  @IsOptional()
  @IsDateString()
  completedAt?: string;

  @IsOptional()
  @IsDateString()
  brokenAt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  breakReason?: string;

  @IsOptional()
  @IsDateString()
  createdAt?: string;

  @IsOptional()
  @IsDateString()
  updatedAt?: string;

  @IsArray()
  @ArrayMaxSize(366)
  @ValidateNested({ each: true })
  @Type(() => LegacyCheckInDto)
  checkIns!: LegacyCheckInDto[];
}

export class ImportCommitmentsDto {
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => LegacyCommitmentDto)
  commitments!: LegacyCommitmentDto[];
}
