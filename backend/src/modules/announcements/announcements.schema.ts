import { z } from 'zod';

export const announcementIdSchema = z.string().cuid();
