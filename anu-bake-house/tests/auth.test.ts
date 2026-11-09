import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from 'jose';
import { authenticateAdmin } from '../src/server/auth.ts';
import { isAdminPath, isSameOriginMutation } from '../src/server/security.ts';

const config = {
  ACCESS_TEAM_DOMAIN: 'bakery-test.cloudflareaccess.com',
  ACCESS_AUD: 'bakery-admin',
  ADMIN_EMAILS: 'owner@example.test',
};
const { publicKey, privateKey } = await generateKeyPair('RS256');
const jwk = await exportJWK(publicKey);
const keys = createLocalJWKSet({ keys: [{ ...jwk, kid: 'test-key', alg: 'RS256' }] });

async function token(
  options: {
    email?: string;
    audience?: string;
    issuer?: string;
    expiry?: string | number;
    subject?: string;
  } = {},
) {
  return new SignJWT({ email: options.email ?? 'owner@example.test' })
    .setProtectedHeader({ alg: 'RS256', kid: 'test-key' })
    .setIssuer(options.issuer ?? 'https://bakery-test.cloudflareaccess.com')
    .setAudience(options.audience ?? 'bakery-admin')
    .setSubject(options.subject ?? 'owner-subject')
    .setIssuedAt()
    .setExpirationTime(options.expiry ?? '5m')
    .sign(privateKey);
}
function request(jwt?: string, url = 'https://bakery.example/admin') {
  return new Request(url, { headers: jwt ? { 'Cf-Access-Jwt-Assertion': jwt } : {} });
}

test('missing production configuration fails closed', async () => {
  assert.equal((await authenticateAdmin(request(), {}, false)).ok, false);
  assert.equal(((await authenticateAdmin(request(), {}, false)) as { status: number }).status, 503);
});
test('missing or forged credentials cannot enter the private workspace', async () => {
  for (const jwt of [undefined, 'forged.jwt.value']) {
    const result = await authenticateAdmin(request(jwt), config, false, keys);
    assert.deepEqual(result.ok, false);
    if (!result.ok) assert.equal(result.status, 401);
  }
});
test('valid signed token for an allowed admin establishes identity', async () => {
  const result = await authenticateAdmin(request(await token()), config, false, keys);
  assert.deepEqual(result, {
    ok: true,
    identity: { subject: 'owner-subject', email: 'owner@example.test', localPreview: false },
  });
});
test('wrong audience, issuer, and expired tokens are rejected', async () => {
  for (const options of [
    { audience: 'another-app' },
    { issuer: 'https://other.cloudflareaccess.com' },
    { expiry: 1 },
  ]) {
    const result = await authenticateAdmin(request(await token(options)), config, false, keys);
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.status, 401);
  }
});
test('valid token from a non-admin cannot grant access', async () => {
  const result = await authenticateAdmin(
    request(await token({ email: 'customer@example.test' })),
    config,
    false,
    keys,
  );
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.status, 403);
});
test('local preview requires development mode, explicit opt-in, and loopback', async () => {
  assert.equal(
    (
      await authenticateAdmin(
        request(undefined, 'http://127.0.0.1/admin'),
        { LOCAL_ADMIN_PREVIEW: 'true' },
        true,
      )
    ).ok,
    true,
  );
  assert.equal(
    (
      await authenticateAdmin(
        request(undefined, 'http://127.0.0.1/admin'),
        { LOCAL_ADMIN_PREVIEW: 'true' },
        false,
      )
    ).ok,
    false,
  );
  assert.equal(
    (await authenticateAdmin(request(), { LOCAL_ADMIN_PREVIEW: 'true' }, true)).ok,
    false,
  );
  assert.equal(
    (await authenticateAdmin(request(undefined, 'http://localhost/admin'), {}, true)).ok,
    false,
  );
});
test('all private paths are identified without treating public lookalikes as private', () => {
  for (const path of [
    '/admin',
    '/admin/orders',
    '/api/admin',
    '/api/admin/status',
    '/api%2fadmin/status',
    '//admin/orders',
  ])
    assert.equal(isAdminPath(path), true);
  for (const path of ['/', '/menu', '/reviews', '/api/health', '/administrator', '/api/administer'])
    assert.equal(isAdminPath(path), false);
});
test('private writes require matching Origin; reads do not', () => {
  assert.equal(isSameOriginMutation(new Request('https://bakery.example/api/admin/test')), true);
  assert.equal(
    isSameOriginMutation(new Request('https://bakery.example/api/admin/test', { method: 'POST' })),
    false,
  );
  assert.equal(
    isSameOriginMutation(
      new Request('https://bakery.example/api/admin/test', {
        method: 'POST',
        headers: { Origin: 'https://evil.example' },
      }),
    ),
    false,
  );
  assert.equal(
    isSameOriginMutation(
      new Request('https://bakery.example/api/admin/test', {
        method: 'POST',
        headers: { Origin: 'https://bakery.example' },
      }),
    ),
    true,
  );
});
