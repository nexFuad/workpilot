import type { Context } from 'hono';
import { getListQuery } from '../../lib/list-query.js';
import { parseJsonBody, pathParam } from '../../lib/validation.js';
import type { AppEnv } from '../../middleware/auth.middleware.js';
import { shiftSchema, siteSchema } from './hr-settings.schema.js';
import {
  createShift,
  createSite,
  deleteShift,
  deleteSite,
  listShifts,
  listSites,
  updateShift,
  updateSite,
} from './hr-settings.service.js';

export async function sites(c: Context<AppEnv>) {
  return c.json(await listSites(getListQuery(c)));
}

export async function createSiteRecord(c: Context<AppEnv>) {
  const input = await parseJsonBody(c, siteSchema, 'Invalid site information.');
  return c.json({ site: await createSite(input) }, 201);
}

export async function updateSiteRecord(c: Context<AppEnv>) {
  const input = await parseJsonBody(c, siteSchema, 'Invalid site information.');
  return c.json({ site: await updateSite(pathParam(c, 'id'), input) });
}

export async function removeSite(c: Context<AppEnv>) {
  await deleteSite(pathParam(c, 'id'));
  return c.json({ message: 'Site deleted.' });
}

export async function shifts(c: Context<AppEnv>) {
  return c.json(await listShifts(getListQuery(c)));
}

export async function createShiftRecord(c: Context<AppEnv>) {
  const input = await parseJsonBody(c, shiftSchema, 'Invalid shift information.');
  return c.json({ shift: await createShift(input) }, 201);
}

export async function updateShiftRecord(c: Context<AppEnv>) {
  const input = await parseJsonBody(c, shiftSchema, 'Invalid shift information.');
  return c.json({ shift: await updateShift(pathParam(c, 'id'), input) });
}

export async function removeShift(c: Context<AppEnv>) {
  await deleteShift(pathParam(c, 'id'));
  return c.json({ message: 'Shift deleted.' });
}
