import { z } from 'zod';
import { container } from '../../../../../src/config/container';
import { handleRouteError, json } from '../../../../../src/adapters/http/responses';
import { requireAdmin } from '../../../../../src/adapters/http/auth';
import { validate } from '../../../../../src/adapters/http/validation';
import { HttpError } from '../../../../../src/adapters/http/errors';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const schema = z.object({
  startedAt: z.string().datetime().optional(),
  endedAt: z.string().datetime().optional(),
  startTz: z.string().optional(),
  endTz: z.string().optional(),
  notes: z.string().max(280).optional()
});

const getId = (context: { params: { id?: string } }) => {
  if (!context.params?.id) {
    throw new HttpError(400, 'Missing shift id');
  }
  return context.params.id;
};

export async function PATCH(request: Request, context: { params: { id: string } }) {
  try {
    await requireAdmin(request);
    const updates = validate(schema, await request.json());
    const normalized = {
      ...updates,
      startedAt: updates.startedAt ? new Date(updates.startedAt) : undefined,
      endedAt: updates.endedAt ? new Date(updates.endedAt) : undefined
    };
    const shift = await container.attendanceUseCase.updateShift(getId(context), normalized);
    return json({ data: shift });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(request: Request, context: { params: { id: string } }) {
  try {
    await requireAdmin(request);
    await container.attendanceUseCase.deleteShift(getId(context));
    return json({ success: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
