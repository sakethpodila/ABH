import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

export function localEnvironment() {
  const logs = resolve('.wrangler/logs');
  mkdirSync(logs, { recursive: true });
  return {
    ...process.env,
    WRANGLER_LOG_PATH: process.env.WRANGLER_LOG_PATH ?? resolve(logs, 'wrangler.log'),
    WRANGLER_SEND_METRICS: process.env.WRANGLER_SEND_METRICS ?? 'false',
    CLOUDFLARE_CF_FETCH_ENABLED: process.env.CLOUDFLARE_CF_FETCH_ENABLED ?? 'false',
    ASTRO_TELEMETRY_DISABLED: '1',
  };
}
