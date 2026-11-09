import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';

export default defineConfig({
  output: 'server',
  session: false,
  adapter: cloudflare({ imageService: 'passthrough' }),
  integrations: [react()],
  devToolbar: { enabled: false },
  // Brand pages explicitly prerender. Private pages and APIs stay server-side.
  server: { host: '127.0.0.1' },
});
