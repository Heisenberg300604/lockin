import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module.js';
import { CommitmentsModule } from './commitments/commitments.module.js';
import { validateEnvironment } from './config/env.validation.js';
import { DatabaseModule } from './database/database.module.js';
import { HealthModule } from './health/health.module.js';
import { UsersModule } from './users/users.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        '.env.local',
        '../../.env.local',
        '../../frontend/.env.local',
        '.env',
      ],
      validate: validateEnvironment,
    }),
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60_000, limit: 100 }],
    }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    HealthModule,
    CommitmentsModule,
  ],
})
export class AppModule {}
