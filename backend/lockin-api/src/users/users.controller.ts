import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ClerkAuthGuard } from '../auth/clerk-auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/authenticated-user.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { UsersService } from './users.service.js';

@ApiTags('profile')
@ApiBearerAuth('clerk')
@UseGuards(ClerkAuthGuard)
@Controller('me')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  @ApiOkResponse({ description: 'The authenticated user profile.' })
  getMe(@CurrentUser() user: AuthenticatedUser) {
    return this.users.getOrCreate(user.clerkId);
  }

  @Patch()
  @ApiOkResponse({ description: 'The updated authenticated user profile.' })
  updateMe(
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: UpdateProfileDto,
  ) {
    return this.users.updateDisplayName(user.clerkId, input.displayName);
  }
}
