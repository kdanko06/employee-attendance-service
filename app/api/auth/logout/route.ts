import { handleRouteError, json } from '../../../../src/adapters/http/responses';
import { requireAuth } from '../../../../src/adapters/http/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    await requireAuth(request);
    return json({ success: true, message: 'Logout handled client-side' });
  } catch (error) {
    return handleRouteError(error);
  }
}
