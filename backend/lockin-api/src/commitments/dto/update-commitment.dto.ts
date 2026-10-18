import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateCommitmentDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  reward?: string;
}
