export function normalizedPath(pathname: string): string {
  return decodeURIComponent(pathname).replace(/\/{2,}/g, '/');
}

export function isAdminPath(pathname: string): boolean {
  const path = normalizedPath(pathname);
  return (
    path === '/admin' ||
    path.startsWith('/admin/') ||
    path === '/api/admin' ||
    path.startsWith('/api/admin/')
  );
}

export function isSameOriginMutation(request: Request): boolean {
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) return true;
  return request.headers.get('Origin') === new URL(request.url).origin;
}
