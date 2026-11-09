import type { APIRoute } from 'astro';

export const GET: APIRoute = () =>
  Response.json(
    { status: 'ok', application: 'anu-bake-house' },
    {
      headers: { 'Cache-Control': 'no-store' },
    },
  );
