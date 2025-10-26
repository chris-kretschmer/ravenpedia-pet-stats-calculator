import type { APIRoute } from 'astro';
import talents from '@/data/talents.json';
import { randomBytes } from 'crypto';

/**
 * Generates a random alphanumeric string of a given length.
 */
function randomAlphaNumeric(length: number): string {
  if (length <= 0) {
    return '';
  }

  const byteLength = Math.ceil(length * 0.75);

  return randomBytes(byteLength)
    .toString('base64')
    .replace(/[^A-Za-z0-9]/g, '')
    .slice(0, length);
}

export const GET: APIRoute = ({ request }) => {
  const url = new URL(request.url);
  const lang = url.searchParams.get('lang') === 'en' ? 'en' : 'de';

  const localizedTalents = {
    ...talents,
    talentGroups: talents.talentGroups.map(group => ({
      ...group,
      groupName: lang === 'en' ? group.groupName_en : group.groupName_de,
      talents: group.talents.map(talent => ({
        ...talent,
        name: lang === 'en' ? talent.name_en : talent.name_de,
      })),
    })),
  };

  const json = JSON.stringify(localizedTalents);

  try {
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

  // - firstDigit: random 1-9
  // - secondDigit: random 1-3
  // - N = max(0, firstDigit - secondDigit)
  // - add N random alphanumeric characters after the two digits, then the base64 payload
  const firstDigit = Math.floor(Math.random() * 11) + 10; // 10..20
  const secondDigit = Math.floor(Math.random() * 3) + 1; // 1..3
  const N = Math.max(0, firstDigit - secondDigit);
  const randomPrefix = randomAlphaNumeric(N);

  const base64 = Buffer.from(json, 'utf8').toString('base64');
  const payload = `${firstDigit}${secondDigit}${randomPrefix}${base64}`;

  return new Response(payload, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
      'X-Content-Encoded': 'base64'
    }
  });
}