import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { HealthController } from './../src/health/health.controller.js';
import { PrismaService } from './../src/database/prisma.service.js';

describe('HealthController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [{ provide: PrismaService, useValue: {} }],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  it('/api/health/live (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/health/live')
      .expect(200)
      .expect({ status: 'ok', service: 'lockin-api' });
  });

  afterEach(async () => {
    await app.close();
  });
});
