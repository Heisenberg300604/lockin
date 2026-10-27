import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CheckInOutcome,
  CommitmentKind,
  CommitmentStatus,
  Prisma,
  RuleFrequency,
} from '../generated/prisma/client.js';
import { PrismaService } from '../database/prisma.service.js';
import { UsersService } from '../users/users.service.js';
import { CreateCheckInDto } from './dto/create-check-in.dto.js';
import { CreateCommitmentDto } from './dto/create-commitment.dto.js';
import { ListCommitmentsDto } from './dto/list-commitments.dto.js';
import { UpdateCommitmentDto } from './dto/update-commitment.dto.js';
import { ImportCommitmentsDto, LegacyCommitmentDto } from './dto/import-commitments.dto.js';
import {
  addDays,
  DAILY_BACKFILL_DAYS,
  dateFromKey,
  dateKey,
  daysBetween,
  evaluateLifecycle,
  isoWeekday,
  validatePeriodFeasibility,
} from './commitment-lifecycle.js';

function todayIn(timeZone: string) {
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(new Date());
    const part = (type: Intl.DateTimeFormatPartTypes) =>
      parts.find((item) => item.type === type)?.value;
    return `${part('year')}-${part('month')}-${part('day')}`;
  } catch {
    throw new BadRequestException('timeZone must be a valid IANA time zone.');
  }
}

@Injectable()
export class CommitmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UsersService,
  ) {}

  async create(clerkId: string, input: CreateCommitmentDto) {
    this.validateCreateInput(input);
    const user = await this.users.getOrCreate(clerkId);
    return this.prisma.commitment.create({
      data: {
        userId: user.id,
        title: input.title.trim(),
        description: input.description?.trim() || null,
        kind: input.kind,
        startDate: dateFromKey(input.startDate),
        endDate: dateFromKey(input.endDate),
        timeZone: input.timeZone,
        ruleFrequency: input.ruleFrequency,
        targetCount: input.targetCount,
        windowDays: input.windowDays ?? null,
        scheduledDays: [...(input.scheduledDays ?? [])].sort((a, b) => a - b),
        reward: input.reward.trim(),
      },
      include: { checkIns: true },
    });
  }

  /**
   * Moves records created by the pre-API browser-only MVP into the signed-in
   * member's account. legacyId makes retries safe and prevents duplicate rows.
   */
  async importLegacy(clerkId: string, input: ImportCommitmentsDto) {
    const user = await this.users.getOrCreate(clerkId);
    let imported = 0;
    let skipped = 0;

    await this.prisma.$transaction(async (tx) => {
      for (const item of input.commitments) {
        this.validateLegacyImport(item);
        const alreadyImported = await tx.commitment.findFirst({
          where: { userId: user.id, legacyId: item.legacyId },
          select: { id: true },
        });
        if (alreadyImported) {
          skipped += 1;
          continue;
        }

        const createdAt = item.createdAt ? new Date(item.createdAt) : new Date();
        const updatedAt = item.updatedAt ? new Date(item.updatedAt) : createdAt;
        await tx.commitment.create({
          data: {
            userId: user.id,
            legacyId: item.legacyId,
            title: item.title.trim(),
            description: item.description?.trim() || null,
            kind: item.kind,
            startDate: dateFromKey(item.startDate),
            endDate: dateFromKey(item.endDate),
            timeZone: item.timeZone,
            ruleFrequency: item.ruleFrequency,
            targetCount: item.targetCount,
            windowDays: item.windowDays ?? null,
            scheduledDays: [...(item.scheduledDays ?? [])].sort((a, b) => a - b),
            reward: item.reward.trim(),
            status: item.status,
            pausedAt:
              item.status === CommitmentStatus.PAUSED ? updatedAt : null,
            completedAt: item.completedAt ? new Date(item.completedAt) : null,
            brokenAt: item.brokenAt ? new Date(item.brokenAt) : null,
            breakReason: item.breakReason?.trim() || null,
            createdAt,
            updatedAt,
            checkIns: {
              create: item.checkIns.map((entry) => ({
                userId: user.id,
                date: dateFromKey(entry.date),
                outcome: entry.outcome,
                note: entry.note?.trim() || null,
                reason: entry.reason?.trim() || null,
                createdAt: entry.createdAt ? new Date(entry.createdAt) : createdAt,
              })),
            },
          },
        });
        imported += 1;
      }
    });

    return { imported, skipped };
  }

  async list(clerkId: string, query: ListCommitmentsDto) {
    await this.users.getOrCreate(clerkId);
    await this.reconcileOwnedActiveCommitments(clerkId);
    return this.prisma.commitment.findMany({
      where: { user: { clerkId }, ...(query.status ? { status: query.status } : {}) },
      ...(query.includeCheckIns === false
        ? {}
        : { include: { checkIns: { orderBy: { date: 'asc' } } } }),
      orderBy: { createdAt: 'desc' },
    });
  }

  async get(clerkId: string, id: string) {
    const commitment = await this.findOwned(clerkId, id);
    await this.reconcile(commitment);
    return this.findOwned(clerkId, id);
  }

  async update(clerkId: string, id: string, input: UpdateCommitmentDto) {
    const existing = await this.findOwned(clerkId, id);
    await this.reconcile(existing);
    const commitment = await this.findOwned(clerkId, id);
    if (commitment.status !== CommitmentStatus.ACTIVE) {
      throw new ConflictException('Only active commitments can be edited.');
    }
    return this.prisma.commitment.update({
      where: { id },
      data: {
        ...(input.title !== undefined ? { title: input.title.trim() } : {}),
        ...(input.description !== undefined
          ? { description: input.description.trim() || null }
          : {}),
        ...(input.reward !== undefined ? { reward: input.reward.trim() } : {}),
      },
      include: { checkIns: { orderBy: { date: 'asc' } } },
    });
  }

  async pause(clerkId: string, id: string) {
    const existing = await this.findOwned(clerkId, id);
    await this.reconcile(existing);
    const commitment = await this.findOwned(clerkId, id);
    if (commitment.status !== CommitmentStatus.ACTIVE) {
      throw new ConflictException('Only active commitments can be paused.');
    }
    return this.prisma.commitment.update({
      where: { id },
      data: { status: CommitmentStatus.PAUSED, pausedAt: new Date() },
    });
  }

  async resume(clerkId: string, id: string) {
    const commitment = await this.findOwned(clerkId, id);
    if (commitment.status !== CommitmentStatus.PAUSED || !commitment.pausedAt) {
      throw new ConflictException('Only paused commitments can be resumed.');
    }
    const pausedDay = this.dateInCommitmentZone(commitment.pausedAt, commitment.timeZone);
    const resumedDay = todayIn(commitment.timeZone);
    const extension = Math.max(0, daysBetween(pausedDay, resumedDay));
    return this.prisma.commitment.update({
      where: { id },
      data: {
        status: CommitmentStatus.ACTIVE,
        pausedAt: null,
        endDate: dateFromKey(addDays(dateKey(commitment.endDate), extension)),
      },
    });
  }

  async checkIn(clerkId: string, id: string, input: CreateCheckInDto) {
    const existing = await this.findOwned(clerkId, id);
    await this.reconcile(existing);
    const commitment = await this.findOwned(clerkId, id);
    if (commitment.status !== CommitmentStatus.ACTIVE) {
      throw new ConflictException('This commitment is not active.');
    }
    const today = todayIn(commitment.timeZone);
    const checkInDate = input.date ?? today;
    if (checkInDate > today) {
      throw new ConflictException('Future dates cannot be logged.');
    }
    if (daysBetween(checkInDate, today) > DAILY_BACKFILL_DAYS) {
      throw new ConflictException('Check-ins may only be backfilled for the previous two days.');
    }
    if (checkInDate < dateKey(commitment.startDate) || checkInDate > dateKey(commitment.endDate)) {
      throw new ConflictException('Check-ins are only available during the commitment timeline.');
    }
    if (commitment.kind === CommitmentKind.BUILD && input.outcome === CheckInOutcome.BROKEN) {
      throw new BadRequestException('Build commitments can only record a kept check-in.');
    }
    if (
      commitment.scheduledDays.length > 0 &&
      !commitment.scheduledDays.includes(isoWeekday(checkInDate))
    ) {
      throw new ConflictException('Today is not a scheduled execution day.');
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        const entry = await tx.checkIn.create({
          data: {
            commitmentId: commitment.id,
            userId: commitment.userId,
            date: dateFromKey(checkInDate),
            outcome: input.outcome,
            note: input.note?.trim() || null,
            reason: input.reason?.trim() || null,
          },
        });
        if (input.outcome === CheckInOutcome.BROKEN) {
          await tx.commitment.update({
            where: { id: commitment.id },
            data: {
              status: CommitmentStatus.BROKEN,
              brokenAt: new Date(),
              breakReason: input.reason?.trim() || 'Commitment broken.',
            },
          });
        }
        return entry;
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('This date has already been logged.');
      }
      throw error;
    }
  }

  async remove(clerkId: string, id: string) {
    await this.findOwned(clerkId, id);
    await this.prisma.commitment.delete({ where: { id } });
  }

  private async findOwned(clerkId: string, id: string) {
    const commitment = await this.prisma.commitment.findFirst({
      where: { id, user: { clerkId } },
      include: { checkIns: { orderBy: { date: 'asc' } } },
    });
    if (!commitment) throw new NotFoundException('Commitment not found.');
    return commitment;
  }

  private async reconcileOwnedActiveCommitments(clerkId: string) {
    const commitments = await this.prisma.commitment.findMany({
      where: { status: CommitmentStatus.ACTIVE, user: { clerkId } },
      include: { checkIns: { orderBy: { date: 'asc' } } },
    });
    await Promise.all(commitments.map((commitment) => this.reconcile(commitment)));
  }

  /**
   * Status transitions are derived from immutable check-ins and persisted here,
   * before user-visible reads and mutations. A future scheduler can call this
   * same rule without changing the source of truth.
   */
  private async reconcile(commitment: Awaited<ReturnType<CommitmentsService['findOwned']>>) {
    const transition = evaluateLifecycle(commitment, todayIn(commitment.timeZone));
    if (!transition) return;
    await this.prisma.commitment.updateMany({
      where: { id: commitment.id, status: CommitmentStatus.ACTIVE },
      data:
        'reason' in transition
          ? {
              status: CommitmentStatus.BROKEN,
              brokenAt: new Date(),
              breakReason: transition.reason,
            }
          : {
              status: CommitmentStatus.COMPLETED,
              completedAt: new Date(),
            },
    });
  }

  private validateCreateInput(input: CreateCommitmentDto) {
    if (input.endDate < input.startDate) {
      throw new BadRequestException('The end date must not precede the start date.');
    }
    if (daysBetween(input.startDate, input.endDate) + 1 > 365) {
      throw new BadRequestException('A commitment may not exceed 365 days.');
    }
    const today = todayIn(input.timeZone);
    if (input.startDate < today) {
      throw new BadRequestException('The start date cannot be in the past.');
    }
    if (input.kind === CommitmentKind.QUIT && (input.ruleFrequency !== RuleFrequency.DAILY || input.targetCount !== 1)) {
      throw new BadRequestException('Quit commitments must use a daily target of one.');
    }
    if (input.ruleFrequency === RuleFrequency.DAILY && input.targetCount !== 1) {
      throw new BadRequestException('Daily commitments must use a target of one.');
    }
    if (input.ruleFrequency === RuleFrequency.WEEKLY && input.targetCount > 7) {
      throw new BadRequestException('Weekly targets cannot exceed seven.');
    }
    if (input.ruleFrequency === RuleFrequency.WINDOW) {
      if (!input.windowDays || input.targetCount > input.windowDays) {
        throw new BadRequestException('Window targets cannot exceed the window length.');
      }
    } else if (input.windowDays) {
      throw new BadRequestException('windowDays is only valid for window rules.');
    }
    const scheduledDays = input.scheduledDays ?? [];
    if (scheduledDays.length && input.ruleFrequency !== RuleFrequency.WEEKLY) {
      throw new BadRequestException('Scheduled days are only valid for weekly rules.');
    }
    if (scheduledDays.length && scheduledDays.length !== input.targetCount) {
      throw new BadRequestException('A custom schedule must have one target for each selected day.');
    }
    const feasibilityError = validatePeriodFeasibility({
      startDate: dateFromKey(input.startDate),
      endDate: dateFromKey(input.endDate),
      ruleFrequency: input.ruleFrequency,
      windowDays: input.windowDays ?? null,
      targetCount: input.targetCount,
      scheduledDays,
    });
    if (feasibilityError) throw new BadRequestException(feasibilityError);
  }

  private validateLegacyImport(input: LegacyCommitmentDto) {
    if (input.endDate < input.startDate) {
      throw new BadRequestException('An imported commitment has an invalid date range.');
    }
    if (daysBetween(input.startDate, input.endDate) + 1 > 365) {
      throw new BadRequestException('An imported commitment exceeds the 365-day limit.');
    }
    if (input.kind === CommitmentKind.QUIT && (input.ruleFrequency !== RuleFrequency.DAILY || input.targetCount !== 1)) {
      throw new BadRequestException('Imported quit commitments must use a daily target of one.');
    }
    if (input.ruleFrequency === RuleFrequency.DAILY && input.targetCount !== 1) {
      throw new BadRequestException('Imported daily commitments must use a target of one.');
    }
    if (input.ruleFrequency === RuleFrequency.WEEKLY && input.targetCount > 7) {
      throw new BadRequestException('Imported weekly targets cannot exceed seven.');
    }
    if (input.ruleFrequency === RuleFrequency.WINDOW) {
      if (!input.windowDays || input.targetCount > input.windowDays) {
        throw new BadRequestException('Imported window targets cannot exceed the window length.');
      }
    } else if (input.windowDays) {
      throw new BadRequestException('windowDays is only valid for window rules.');
    }
    const scheduledDays = input.scheduledDays ?? [];
    if (scheduledDays.length && input.ruleFrequency !== RuleFrequency.WEEKLY) {
      throw new BadRequestException('Scheduled days are only valid for weekly rules.');
    }
    if (scheduledDays.length && scheduledDays.length !== input.targetCount) {
      throw new BadRequestException('A custom schedule needs one target per selected day.');
    }
    const dates = new Set<string>();
    for (const checkIn of input.checkIns) {
      if (checkIn.date < input.startDate || checkIn.date > input.endDate) {
        throw new BadRequestException('An imported check-in is outside its commitment timeline.');
      }
      if (dates.has(checkIn.date)) {
        throw new BadRequestException('An imported commitment contains duplicate check-ins.');
      }
      dates.add(checkIn.date);
      if (input.kind === CommitmentKind.BUILD && checkIn.outcome === CheckInOutcome.BROKEN) {
        throw new BadRequestException('Build commitments cannot import broken check-ins.');
      }
    }
  }

  private dateInCommitmentZone(value: Date, timeZone: string) {
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(value);
    const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value;
    return `${part('year')}-${part('month')}-${part('day')}`;
  }

}
