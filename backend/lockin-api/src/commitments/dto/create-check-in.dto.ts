import { IsEnum, IsOptional, IsString, MaxLength, ValidateIf } from 'class-validator';
import { CheckInOutcome } from '../../generated/prisma/client.js';

export class CreateCheckInDto {
  @IsEnum(CheckInOutcome)
  outcome!: CheckInOutcome;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;

  @ValidateIf((input: CreateCheckInDto) => input.outcome === CheckInOutcome.BROKEN)
  @IsString()
  @MaxLength(240)
  reason?: string;
}
