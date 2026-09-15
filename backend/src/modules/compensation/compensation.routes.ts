import { Hono } from 'hono';
import { requireAuth, requireHrRole, type AppEnv } from '../../middleware/auth.middleware.js';
import {
  createAdvance,
  createLoan,
  loans,
  reviewAdvance,
  reviewLoan,
  salary,
} from './compensation.controller.js';

export const compensationRoutes = new Hono<AppEnv>()
  .use('*', requireAuth)
  .get('/salary', salary)
  .post('/salary/advances', createAdvance)
  .get('/loans', loans)
  .post('/loans', createLoan)
  .patch('/review/advances/:id', requireHrRole, reviewAdvance)
  .patch('/review/loans/:id', requireHrRole, reviewLoan);
