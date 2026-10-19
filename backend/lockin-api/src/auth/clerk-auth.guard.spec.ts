import { UnauthorizedException, type ExecutionContext } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { verifyToken } from '@clerk/backend';
import { ClerkAuthGuard } from './clerk-auth.guard.js';

vi.mock('@clerk/backend', () => ({ verifyToken: vi.fn() }));

const ORIGINS = 'https://lockin-web-app.vercel.app, http://localhost:3000';

const env: Record<string, string> = {
  FRONTEND_ORIGINS: ORIGINS,
  CLERK_SECRET_KEY: 'sk_test_dummy',
};

const config = {
  get: (key: string) => env[key],
  getOrThrow: (key: string) => {
    if (!(key in env)) throw new Error(`Missing ${key}`);
    return env[key];
  },
} as unknown as ConfigService;

const base64url = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');

const makeToken = (payload: Record<string, unknown>) =>
  `${base64url({ alg: 'RS256', typ: 'JWT' })}.${base64url(payload)}.${Buffer.from('sig').toString('base64url')}`;

const contextFor = (authorization?: string) => {
  const request: { headers: { authorization?: string }; user?: unknown } = {
    headers: { authorization },
  };
  const context = {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
  return { context, request };
};

describe('ClerkAuthGuard', () => {
  const verifyTokenMock = vi.mocked(verifyToken);
  let guard: ClerkAuthGuard;

  beforeEach(() => {
    verifyTokenMock.mockReset();
    verifyTokenMock.mockResolvedValue({ sub: 'user_123', sid: 'sess_123' } as never);
    guard = new ClerkAuthGuard(config);
  });

  it('verifies native tokens without azp but skips the authorized-party check', async () => {
    const { context, request } = contextFor(`Bearer ${makeToken({ sub: 'user_123' })}`);

    await expect(guard.canActivate(context)).resolves.toBe(true);

    expect(verifyTokenMock).toHaveBeenCalledTimes(1);
    const options = verifyTokenMock.mock.calls[0][1];
    expect(options).toMatchObject({ secretKey: 'sk_test_dummy' });
    expect(options).not.toHaveProperty('authorizedParties');
    expect(request.user).toEqual({ clerkId: 'user_123', sessionId: 'sess_123' });
  });

  it('enforces authorized parties for browser tokens with azp', async () => {
    const token = makeToken({ sub: 'user_123', azp: 'https://lockin-web-app.vercel.app' });
    const { context } = contextFor(`Bearer ${token}`);

    await expect(guard.canActivate(context)).resolves.toBe(true);

    expect(verifyTokenMock).toHaveBeenCalledWith(token, {
      secretKey: 'sk_test_dummy',
      authorizedParties: ['https://lockin-web-app.vercel.app', 'http://localhost:3000'],
    });
  });

  it('rejects a malformed token with the generic 401', async () => {
    const { context } = contextFor('Bearer not-a-jwt');

    await expect(guard.canActivate(context)).rejects.toThrow(
      new UnauthorizedException('A valid bearer token is required.'),
    );
    expect(verifyTokenMock).not.toHaveBeenCalled();
  });

  it('rejects with the generic 401 when verification fails', async () => {
    verifyTokenMock.mockRejectedValueOnce(new Error('Invalid JWT authorized party claim (azp)'));
    const token = makeToken({ sub: 'user_123', azp: 'https://evil.example' });
    const { context } = contextFor(`Bearer ${token}`);

    await expect(guard.canActivate(context)).rejects.toThrow(
      new UnauthorizedException('A valid bearer token is required.'),
    );
  });

  it('rejects requests without a bearer header', async () => {
    const { context } = contextFor();

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
    expect(verifyTokenMock).not.toHaveBeenCalled();
  });
});
