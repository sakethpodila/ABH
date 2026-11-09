import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { menuImageApi } from '../../../../server/menu-images';
export const POST: APIRoute = (context) => menuImageApi(context, env.BUCKET, 'upload');
