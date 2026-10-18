import { IsEnum, IsOptional } from 'class-validator';
import { CommitmentStatus } from '../../generated/prisma/client.js';

export class ListCommitmentsDto {
  @IsOptional()
  @IsEnum(CommitmentStatus)
  status?: CommitmentStatus;
}
