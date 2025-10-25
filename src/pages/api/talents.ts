import type { APIRoute } from 'astro';
import talents from '@/data/talents.json';

export const GET: APIRoute = ({ request }) => {
  const json = JSON.stringify(talents);

  try {
    const url = new URL(request.url);
    const rawParam = url.searchParams.get('raw') === '1';
    const accept = (request.headers.get('accept') || '').toLowerCase();

    // If client specifically requests raw JSON (via ?raw=1 or Accept header), return plain JSON
    if (rawParam || accept.includes('application/json')) {
      return new Response(json, {
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'public, max-age=3600'
        }
      });
    }
  } catch (e) {
    // ignore URL parsing errors and fall back to returning JSON
  }

  // Default: return JSON (avoid base64 encoding) so clients receive properly encoded UTF-8
  return new Response(json, {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600'
    }
  });
}