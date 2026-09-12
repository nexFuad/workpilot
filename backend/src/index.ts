import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'

const app = new Hono()

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'http://127.0.0.1:3000',
].filter((origin): origin is string => Boolean(origin))

app.use('*', cors({
  origin: (origin) => (allowedOrigins.includes(origin) ? origin : allowedOrigins[0]),
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
}))

app.get('/', (c) => c.json({ name: 'WorkPilot API', status: 'ok' }))
app.get('/api/health', (c) => c.json({ status: 'ok' }))

serve({
  fetch: app.fetch,
  port: Number(process.env.PORT) || 3000,
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})
