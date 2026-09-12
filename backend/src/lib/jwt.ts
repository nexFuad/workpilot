import { SignJWT, jwtVerify } from 'jose';
import { env } from '../config/env.js';

export type AuthRole = 'admin' | 'hr' | 'employee';
export type TokenPayload = {
  userId: string;
  role: AuthRole;
  type: 'access' | 'refresh';
  sessionId?: string;
};

const secret = new TextEncoder().encode(env.AUTH_JWT_SECRET);

export async function signToken(payload: TokenPayload, expiresIn: string) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secret);
}

export async function verifyToken(token: string, expectedType: TokenPayload['type']) {
  const { payload } = await jwtVerify(token, secret);
  if (
    payload.type !== expectedType ||
    typeof payload.userId !== 'string' ||
    typeof payload.role !== 'string'
  ) {
    throw new Error('Invalid token');
  }
  return payload as unknown as TokenPayload;
}
