import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { env } from './config/env.js';
import { authRoutes } from './modules/auth/auth.routes.js';
export const app = new Hono();
app.use('*', cors({
    origin: [env.FRONTEND_URL, 'http://localhost:3000'],
    credentials: true,
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
}));
app.get('/', (c) => c.json({ name: 'WorkPilot API', status: 'ok' }));
app.get('/api/health', (c) => c.json({ status: 'ok' }));
app.route('/api/auth', authRoutes);
