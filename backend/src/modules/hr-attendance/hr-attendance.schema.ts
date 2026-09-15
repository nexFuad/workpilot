import { z } from 'zod';

export const attendanceDateSchema = z.string().date();
