import { z } from 'zod';
import { container } from '../../../../src/config/container';
import { handleRouteError, json } from '../../../../src/adapters/http/responses';
import { requireAuth } from '../../../../src/adapters/http/auth';
import { validate } from '../../../../src/adapters/http/validation';
import { env } from '../../../../src/config/env';

const schema = z.object({
  timezone: z.string().default(env.TZ),
  notes: z.string().max(280).optional()
});

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const auth = await requireAuth(request);
    const input = validate(schema, await request.json().catch(() => ({})));
    const timezone = input.timezone ?? env.TZ;
    const shift = await container.attendanceUseCase.signOff({
      employerId: auth.sub,
      timezone,
      notes: input.notes
    });
    return json({ data: shift });
  } catch (error) {
    return handleRouteError(error);
  }
}
