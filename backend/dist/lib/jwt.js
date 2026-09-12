import { SignJWT, jwtVerify } from 'jose';
import { env } from '../config/env.js';
const secret = new TextEncoder().encode(env.AUTH_JWT_SECRET);
export async function signToken(payload, expiresIn) {
    return new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(expiresIn)
        .sign(secret);
}
export async function verifyToken(token, expectedType) {
    const { payload } = await jwtVerify(token, secret);
    if (payload.type !== expectedType ||
        typeof payload.userId !== 'string' ||
        typeof payload.role !== 'string') {
        throw new Error('Invalid token');
    }
    return payload;
}
