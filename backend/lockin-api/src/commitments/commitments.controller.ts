import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ClerkAuthGuard } from '../auth/clerk-auth.guard.js';
import type { AuthenticatedUser } from '../auth/authenticated-user.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { CommitmentsService } from './commitments.service.js';
import { CreateCheckInDto } from './dto/create-check-in.dto.js';
import { CreateCommitmentDto } from './dto/create-commitment.dto.js';
import { ListCommitmentsDto } from './dto/list-commitments.dto.js';
import { UpdateCommitmentDto } from './dto/update-commitment.dto.js';

@ApiTags('commitments')
@ApiBearerAuth('clerk')
@UseGuards(ClerkAuthGuard)
@Controller('commitments')
export class CommitmentsController {
  constructor(private readonly commitments: CommitmentsService) {}

  @Post()
  @ApiCreatedResponse({ description: 'Commitment created.' })
  create(@CurrentUser() user: AuthenticatedUser, @Body() input: CreateCommitmentDto) {
    return this.commitments.create(user.clerkId, input);
  }

  @Get()
  @ApiOkResponse({ description: 'Authenticated user commitments.' })
  list(@CurrentUser() user: AuthenticatedUser, @Query() query: ListCommitmentsDto) {
    return this.commitments.list(user.clerkId, query);
  }

  @Get(':id')
  @ApiOkResponse({ description: 'Owned commitment with check-in history.' })
  @ApiNotFoundResponse({ description: 'Commitment is absent or belongs to another user.' })
  get(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.commitments.get(user.clerkId, id);
  }

  @Patch(':id')
  @ApiOkResponse({ description: 'Active commitment updated.' })
  @ApiConflictResponse({ description: 'Inactive commitments cannot be edited.' })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() input: UpdateCommitmentDto,
  ) {
    return this.commitments.update(user.clerkId, id, input);
  }

  @Post(':id/check-ins')
  @ApiCreatedResponse({ description: 'Current-date check-in recorded.' })
  @ApiConflictResponse({ description: 'Duplicate, unscheduled, or inactive commitment check-in.' })
  checkIn(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() input: CreateCheckInDto,
  ) {
    return this.commitments.checkIn(user.clerkId, id, input);
  }

  @Post(':id/pause')
  @ApiOkResponse({ description: 'Commitment paused.' })
  pause(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.commitments.pause(user.clerkId, id);
  }

  @Post(':id/resume')
  @ApiOkResponse({ description: 'Commitment resumed and its end date extended by paused days.' })
  resume(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.commitments.resume(user.clerkId, id);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiNoContentResponse({ description: 'Commitment and its check-ins deleted.' })
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.commitments.remove(user.clerkId, id);
  }
}
