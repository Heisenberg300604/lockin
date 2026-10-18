import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /** Idempotently provisions the minimum application record for a Clerk identity. */
  async getOrCreate(clerkId: string) {
    return this.prisma.userProfile.upsert({
      where: { clerkId },
      create: { clerkId },
      update: {},
    });
  }

  async updateDisplayName(clerkId: string, displayName?: string) {
    return this.prisma.userProfile.upsert({
      where: { clerkId },
      create: { clerkId, displayName: displayName?.trim() || null },
      update: { displayName: displayName?.trim() || null },
    });
  }
}
