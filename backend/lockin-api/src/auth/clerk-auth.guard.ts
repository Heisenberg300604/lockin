import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { verifyToken } from '@clerk/backend';
import type { Request } from 'express';
import type { AuthenticatedUser } from './authenticated-user.js';

type AuthenticatedRequest = Request & { user?: AuthenticatedUser };

@Injectable()
export class ClerkAuthGuard implements CanActivate {
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
      const claims = await verifyToken(token, {
        secretKey: this.config.getOrThrow<string>('CLERK_SECRET_KEY'),
        ...(this.config.get<string>('CLERK_JWT_KEY')
          ? { jwtKey: this.config.get<string>('CLERK_JWT_KEY') }
          : {}),
        authorizedParties: origins,
      });
      if (!claims.sub) throw new Error('Token has no subject.');
      request.user = { clerkId: claims.sub, sessionId: claims.sid };
      return true;
    } catch {
      throw new UnauthorizedException('A valid bearer token is required.');
    }
  }
}
