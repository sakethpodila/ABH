/// <reference types="astro/client" />

declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    APP_ENV?: string;
    LOCAL_ADMIN_PREVIEW?: string;
    ACCESS_TEAM_DOMAIN?: string;
    ACCESS_AUD?: string;
    ADMIN_EMAILS?: string;
    TURNSTILE_SECRET_KEY?: string;
  }
}

declare namespace App {
  interface Locals {
    admin?: import('./business/types').AdminIdentity;
  }
}
