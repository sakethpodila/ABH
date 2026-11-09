import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { menuApi } from '../../../../server/menu-api';

export const GET: APIRoute = (context) => menuApi(context, env.DB, 'get');
export const PUT: APIRoute = (context) => menuApi(context, env.DB, 'update', env.BUCKET);
export const PATCH: APIRoute = (context) => menuApi(context, env.DB, 'publication', env.BUCKET);
