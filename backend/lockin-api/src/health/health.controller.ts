import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiOkResponse, ApiServiceUnavailableResponse, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../database/prisma.service.js';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('live')
  @ApiOkResponse({ description: 'Process liveness.' })
  live() {
    return { status: 'ok', service: 'lockin-api' };
  }

  @Get('ready')
  @ApiOkResponse({ description: 'Database is reachable.' })
  @ApiServiceUnavailableResponse({ description: 'Database is unavailable.' })
  async ready() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok', database: 'ready' };
    } catch {
      throw new ServiceUnavailableException('Database is unavailable.');
    }
  }
}
