import type { APIRoute } from 'astro';
import talents from '@/data/talents.json';

export const GET: APIRoute = () => {
  return new Response(
    JSON.stringify(talents),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    }
  )
}