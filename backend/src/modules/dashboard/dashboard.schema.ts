import { z } from 'zod';

export const dashboardScopeSchema = z.enum(['employee', 'hr']);
