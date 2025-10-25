import type { APIRoute } from 'astro';
import talents from '@/data/talents.json';

export const GET: APIRoute = ({ request }) => {
  const json = JSON.stringify(talents);

  // If client specifically requests raw JSON (for debugging) via ?raw=1 or Accept header,
  // return plain JSON. Otherwise return base64-encoded payload.
  try {
    const url = new URL(request.url);
    const rawParam = url.searchParams.get('raw') === '1';
    const accept = (request.headers.get('accept') || '').toLowerCase();

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
    // ignore URL parsing errors and fall back to encoded response
  }

  // Default: return base64 encoded payload and include a header so the client can detect it
  const encoded = Buffer.from(json, 'utf8').toString('base64');

  return new Response(encoded, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Content-Encoded': 'base64',
      'Cache-Control': 'public, max-age=3600'
    }
  });
}