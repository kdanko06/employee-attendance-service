import { z } from 'zod';
import { container } from '../../../../src/config/container';
import { handleRouteError, json } from '../../../../src/adapters/http/responses';
import { validate } from '../../../../src/adapters/http/validation';
import { requireAdmin } from '../../../../src/adapters/http/auth';
import { HttpError } from '../../../../src/adapters/http/errors';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const idFromParams = (params: { id?: string }) => {
  if (!params?.id) {
    throw new HttpError(400, 'Missing employer id');
  }
  return params.id;
};

const updateSchema = z
  .object({
    name: z.string().min(1).optional(),
    role: z.enum(['admin', 'employee']).optional()
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided'
  });

export async function GET(_request: Request, context: { params: { id: string } }) {
  try {
    await requireAdmin(_request);
    const employer = await container.employerUseCase.getEmployer(idFromParams(context.params));
    return json({ data: employer });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: Request, context: { params: { id: string } }) {
  try {
    await requireAdmin(request);
    const updates = validate(updateSchema, await request.json());
    const employer = await container.employerUseCase.updateEmployer(
      idFromParams(context.params),
      updates
    );
    return json({ data: employer });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(request: Request, context: { params: { id: string } }) {
  try {
    await requireAdmin(request);
    await container.employerUseCase.deleteEmployer(idFromParams(context.params));
    return json({ success: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
