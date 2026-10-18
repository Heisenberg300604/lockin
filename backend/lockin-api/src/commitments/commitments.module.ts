import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { UsersModule } from '../users/users.module.js';
import { CommitmentsController } from './commitments.controller.js';
import { CommitmentsService } from './commitments.service.js';

@Module({
  imports: [AuthModule, UsersModule],
  controllers: [CommitmentsController],
  providers: [CommitmentsService],
})
export class CommitmentsModule {}
