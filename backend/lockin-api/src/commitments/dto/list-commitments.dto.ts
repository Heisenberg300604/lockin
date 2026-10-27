import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { CommitmentStatus } from '../../generated/prisma/client.js';

export class ListCommitmentsDto {
  @IsOptional()
  @IsEnum(CommitmentStatus)
  status?: CommitmentStatus;

  /** History is expensive and is only needed by the commitment-detail view. */
  @IsOptional()
  @Transform(({ value }) => value === 'true' ? true : value === 'false' ? false : value)
  @IsBoolean()
  includeCheckIns?: boolean;
}
