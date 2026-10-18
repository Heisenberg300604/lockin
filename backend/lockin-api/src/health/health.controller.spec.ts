import { HealthController } from './health.controller.js';

describe('HealthController', () => {
  it('returns the liveness payload without touching the database', () => {
    const controller = new HealthController({} as never);
    expect(controller.live()).toEqual({ status: 'ok', service: 'lockin-api' });
  });
});
