import { IsEnum, IsOptional, IsString, Matches, MaxLength, ValidateIf } from 'class-validator';
import { CheckInOutcome } from '../../generated/prisma/client.js';

const DATE = /^\d{4}-\d{2}-\d{2}$/;

export class CreateCheckInDto {
  @IsEnum(CheckInOutcome)
  outcome!: CheckInOutcome;

  @IsOptional()
  @Matches(DATE, { message: 'date must be an ISO calendar date.' })
  date?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;

  @ValidateIf((input: CreateCheckInDto) => input.outcome === CheckInOutcome.BROKEN)
  @IsString()
  @MaxLength(240)
  reason?: string;
}
