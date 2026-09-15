import { compare } from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { type AuthRole, type TokenPayload, signToken, verifyToken } from '../../lib/jwt.js';
import { prisma } from '../../lib/prisma.js';

export type PublicUser = {
  id: string;
  employeeId: string;
  companyName: string;
  role: AuthRole;
  fullName: string | null;
  phone: string | null;
  address: string | null;
  profileImage: string | null;
};

function toPublicUser(user: {
  id: string;
  employeeId: string;
  companyName: string;
  role: string;
  fullName: string | null;
  phone: string | null;
  address: string | null;
  profileImage: string | null;
}): PublicUser {
  return {
    id: user.id,
    employeeId: user.employeeId,
    companyName: user.companyName,
    role: user.role as AuthRole,
    fullName: user.fullName,
    phone: user.phone,
    address: user.address,
    profileImage: user.profileImage,
  };
}

export async function authenticateUser(employeeId: string, companyName: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { employeeId_companyName: { employeeId, companyName } },
  });
  if (!user || !user.isActive || !(await compare(password, user.passwordHash))) return null;
  return toPublicUser(user);
}

async function createTokenPair(user: PublicUser, rememberMe: boolean) {
  const sessionId = randomUUID();
  const refreshDays = rememberMe ? 30 : 1;
  const expiresAt = new Date(Date.now() + refreshDays * 24 * 60 * 60 * 1000);
  await prisma.refreshSession.create({
    data: { tokenId: sessionId, userId: user.id, rememberMe, expiresAt },
  });
  const accessToken = await signToken({ userId: user.id, role: user.role, type: 'access' }, '15m');
  const refreshToken = await signToken(
    { userId: user.id, role: user.role, type: 'refresh', sessionId },
    `${refreshDays}d`,
  );
  return { accessToken, refreshToken, refreshDays };
}

export async function createLoginSession(user: PublicUser, rememberMe: boolean) {
  return { user, ...(await createTokenPair(user, rememberMe)) };
}

export async function rotateRefreshToken(token: string) {
  const payload = await verifyToken(token, 'refresh');
  if (!payload.sessionId) throw new Error('Invalid refresh token');
  const session = await prisma.refreshSession.findUnique({
    where: { tokenId: payload.sessionId },
    include: { user: true },
  });
  if (!session || session.revokedAt || session.expiresAt < new Date() || !session.user.isActive)
    throw new Error('Expired refresh token');
  await prisma.refreshSession.update({
    where: { id: session.id },
    data: { revokedAt: new Date() },
  });
  const user = toPublicUser(session.user);
  return { user, ...(await createTokenPair(user, session.rememberMe)) };
}

export async function getCurrentUser(token: string) {
  const payload: TokenPayload = await verifyToken(token, 'access');
  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user || !user.isActive) throw new Error('User not found');
  return toPublicUser(user);
}

export async function revokeRefreshToken(token?: string) {
  if (!token) return;
  try {
    const payload = await verifyToken(token, 'refresh');
    if (payload.sessionId)
      await prisma.refreshSession.updateMany({
        where: { tokenId: payload.sessionId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
  } catch {
    // An expired or invalid cookie needs no database change.
  }
}
