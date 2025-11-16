import { handleRouteError, json } from '../../../../src/adapters/http/responses';
import { requireAdmin } from '../../../../src/adapters/http/auth';
import { container } from '../../../../src/config/container';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const { searchParams } = new URL(request.url);
    const employerId = searchParams.get('employerId') ?? undefined;
    const shifts = await container.attendanceUseCase.listShifts({ employerId });
    return json({ data: shifts });
  } catch (error) {
    return handleRouteError(error);
  }
}
