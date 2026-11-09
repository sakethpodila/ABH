import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { publicMenuImage } from '../../../../server/public-menu';
export const GET: APIRoute = ({ params }) => publicMenuImage(env.DB, env.BUCKET, params.id);
