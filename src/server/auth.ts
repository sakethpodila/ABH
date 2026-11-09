import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from 'jose';
import type { AdminIdentity } from '../business/types.ts';

export interface AccessConfig {
  LOCAL_ADMIN_PREVIEW?: string;
  ACCESS_TEAM_DOMAIN?: string;
  ACCESS_AUD?: string;
  ADMIN_EMAILS?: string;
}

export type AuthResult =
  { ok: true; identity: AdminIdentity } | { ok: false; status: 401 | 403 | 503; message: string };

const keySets = new Map<string, JWTVerifyGetKey>();

export async function authenticateAdmin(
  request: Request,
  config: AccessConfig,
  isDevelopment: boolean,
  resolveKey?: JWTVerifyGetKey,
): Promise<AuthResult> {
  const hostname = new URL(request.url).hostname;
  if (
    isDevelopment &&
    config.LOCAL_ADMIN_PREVIEW === 'true' &&
    ['localhost', '127.0.0.1', '[::1]'].includes(hostname)
  ) {
    return {
      ok: true,
      identity: { subject: 'local-preview', email: 'preview@localhost', localPreview: true },
    };
  }

  const team = config.ACCESS_TEAM_DOMAIN?.trim();
  const audience = config.ACCESS_AUD?.trim();
  const emails =
    config.ADMIN_EMAILS?.split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean) ?? [];
  if (!team || !/^[a-z0-9-]+\.cloudflareaccess\.com$/.test(team) || !audience || !emails.length) {
    return { ok: false, status: 503, message: 'The private workspace is not configured yet.' };
  }

  const token = request.headers.get('Cf-Access-Jwt-Assertion');
  if (!token) return { ok: false, status: 401, message: 'Administrator sign-in is required.' };

  try {
    let keys = resolveKey ?? keySets.get(team);
    if (!keys) {
      keys = createRemoteJWKSet(new URL(`https://${team}/cdn-cgi/access/certs`));
      keySets.set(team, keys);
    }
    const { payload } = await jwtVerify(token, keys, {
      issuer: `https://${team}`,
      audience,
      algorithms: ['RS256'],
      requiredClaims: ['sub', 'exp', 'email'],
    });
    const email = typeof payload.email === 'string' ? payload.email.toLowerCase().trim() : '';
    if (!payload.sub || !email || !emails.includes(email)) {
      return {
        ok: false,
        status: 403,
        message: 'This account does not have administrator access.',
      };
    }
    return { ok: true, identity: { subject: payload.sub, email, localPreview: false } };
  } catch {
    // Never log raw tokens or report token contents to visitors.
    return {
      ok: false,
      status: 401,
      message: 'Your sign-in could not be verified. Please sign in again.',
    };
  }
}
