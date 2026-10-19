import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { verifyToken } from '@clerk/backend';
import { decodeJwt } from '@clerk/backend/jwt';
import type { Request } from 'express';
import type { AuthenticatedUser } from './authenticated-user.js';

type AuthenticatedRequest = Request & { user?: AuthenticatedUser };

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  private readonly logger = new Logger(ClerkAuthGuard.name);

  constructor(private readonly config: ConfigService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const header = request.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException('A valid bearer token is required.');
    }

    const token = header.slice('Bearer '.length).trim();
    if (!token) throw new UnauthorizedException('A valid bearer token is required.');

    try {
      const origins = this.config
        .getOrThrow<string>('FRONTEND_ORIGINS')
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean);
      // Browser tokens carry an `azp` (origin) claim that must match a known
      // frontend. Native apps (Flutter) send no Origin, so their tokens have
      // no `azp`; @clerk/backend v3 rejects a missing `azp` whenever
      // `authorizedParties` is set, so only enforce it when the claim exists.
      const hasAzp = Boolean(decodeJwt(token).payload.azp);
      const claims = await verifyToken(token, {
        secretKey: this.config.getOrThrow<string>('CLERK_SECRET_KEY'),
        ...(this.config.get<string>('CLERK_JWT_KEY')
          ? { jwtKey: this.config.get<string>('CLERK_JWT_KEY') }
          : {}),
        ...(hasAzp ? { authorizedParties: origins } : {}),
      });
      if (!claims.sub) throw new Error('Token has no subject.');
      request.user = { clerkId: claims.sub, sessionId: claims.sid };
      return true;
    } catch (error) {
      this.logger.warn(
        `Token verification failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new UnauthorizedException('A valid bearer token is required.');
    }
  }
}
