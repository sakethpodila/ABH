import { defineMiddleware } from 'astro:middleware';
import { env } from 'cloudflare:workers';
import { authenticateAdmin } from './server/auth';
import { isAdminPath, isSameOriginMutation } from './server/security';

function denied(status: number, message: string, api: boolean): Response {
  const body = api
    ? JSON.stringify({ error: message })
    : `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Private workspace · Anu's Bake House</title><main style="max-width:36rem;margin:12vh auto;padding:2rem;font-family:system-ui;line-height:1.6"><h1>Private workspace</h1><p>${message}</p><p><a href="/">Return to Anu's Bake House</a></p></main></html>`;
  return new Response(body, {
    status,
    headers: {
      'Content-Type': api ? 'application/json' : 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
    },
  });
}

export const onRequest = defineMiddleware(async (context, next) => {
  let privateRoute: boolean;
  try {
    privateRoute = isAdminPath(context.url.pathname);
  } catch {
    return denied(400, 'Invalid request path.', true);
  }

  if (privateRoute) {
    const api = context.url.pathname.startsWith('/api');
    if (!isSameOriginMutation(context.request))
      return denied(403, 'Cross-origin changes are not allowed.', api);
    const auth = await authenticateAdmin(context.request, env, import.meta.env.DEV);
    if (!auth.ok) return denied(auth.status, auth.message, api);
    context.locals.admin = auth.identity;
  }

  const response = await next();
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  if (privateRoute) {
    response.headers.set('Cache-Control', 'no-store');
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  }
  return response;
});
