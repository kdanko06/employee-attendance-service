import { container } from '../../../../src/config/container';
import { handleRouteError, json } from '../../../../src/adapters/http/responses';
import { requireAuth } from '../../../../src/adapters/http/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const auth = await requireAuth(request);
    const profile = await container.employerUseCase.getProfile(auth.sub);
    return json({ data: profile });
  } catch (error) {
    return handleRouteError(error);
  }
}
