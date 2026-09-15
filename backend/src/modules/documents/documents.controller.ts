import type { Context } from 'hono';
import { getListQuery } from '../../lib/list-query.js';
import { parseJsonBody, pathParam } from '../../lib/validation.js';
import { authUser, type AppEnv } from '../../middleware/auth.middleware.js';
import { documentReviewSchema, documentSchema } from './documents.schema.js';
import {
  createDocument,
  deleteDocument,
  listDocuments,
  listDocumentsForReview,
  reviewDocument,
} from './documents.service.js';

export async function list(c: Context<AppEnv>) {
  const search = c.req.query('search')?.trim() ?? '';
  return c.json({ documents: await listDocuments(authUser(c).id, search) });
}

export async function create(c: Context<AppEnv>) {
  const input = await parseJsonBody(c, documentSchema, 'Invalid document.');
  return c.json({ document: await createDocument(authUser(c).id, input) }, 201);
}

export async function listForReview(c: Context<AppEnv>) {
  return c.json(await listDocumentsForReview(getListQuery(c)));
}

export async function review(c: Context<AppEnv>) {
  const input = await parseJsonBody(c, documentReviewSchema, 'Invalid review.');
  return c.json({ document: await reviewDocument(pathParam(c, 'id'), input) });
}

export async function remove(c: Context<AppEnv>) {
  await deleteDocument(pathParam(c, 'id'));
  return c.json({ message: 'Document deleted successfully.' });
}
