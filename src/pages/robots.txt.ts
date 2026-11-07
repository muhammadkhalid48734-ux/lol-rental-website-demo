import type { APIRoute } from 'astro';
import { seo } from '../data/site';

// Driven by the single `seo.indexable` flag in src/data/site.ts.
export const GET: APIRoute = () =>
  new Response(
    seo.indexable
      ? 'User-agent: *\nAllow: /\n'
      : '# Private sales demo. Keep it out of every index.\nUser-agent: *\nDisallow: /\n',
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
  );
