import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ locals }) => {
  // Middleware must establish identity for every private endpoint.
  if (!locals.admin)
    return Response.json({ error: 'Administrator sign-in is required.' }, { status: 401 });
  return Response.json(
    {
      stage: 'menu-publishing',
      localPreview: locals.admin.localPreview,
      businessWorkflowsImplemented: true,
      implementedFeatures: ['menu-management', 'product-images', 'menu-publishing'],
    },
    {
      headers: { 'Cache-Control': 'no-store' },
    },
  );
};
