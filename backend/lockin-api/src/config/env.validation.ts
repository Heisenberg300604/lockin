import { plainToInstance } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
  validateSync,
} from 'class-validator';

class EnvironmentVariables {
  @IsOptional()
  @IsIn(['development', 'test', 'production'])
  NODE_ENV?: string = 'development';

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65535)
  PORT?: number = 3001;

  @IsString()
  @IsNotEmpty()
  DATABASE_URL!: string;

  @IsString()
  @IsNotEmpty()
  CLERK_SECRET_KEY!: string;

  @IsString()
  @IsNotEmpty()
  FRONTEND_ORIGINS!: string;

  @IsOptional()
  @IsString()
  CLERK_JWT_KEY?: string;
}

export function validateEnvironment(config: Record<string, unknown>) {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validated, { skipMissingProperties: false });
  if (errors.length) {
    throw new Error(
      `Invalid environment configuration: ${errors
        .flatMap((error) => Object.values(error.constraints ?? {}))
        .join(', ')}`,
    );
  }
  return validated;
}
