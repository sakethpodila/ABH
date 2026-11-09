import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { menuApi } from '../../../../server/menu-api';

export const GET: APIRoute = (context) => menuApi(context, env.DB, 'list');
export const POST: APIRoute = (context) => menuApi(context, env.DB, 'create', env.BUCKET);
