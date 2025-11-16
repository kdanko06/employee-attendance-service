import { handleRouteError, json } from '../../../../src/adapters/http/responses';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    return json({ accessToken: null, message: 'Refresh tokens not yet implemented' });
  } catch (error) {
    return handleRouteError(error);
  }
}
