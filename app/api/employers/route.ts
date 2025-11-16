import { z } from 'zod';
import { container } from '../../../src/config/container';
import { handleRouteError, json } from '../../../src/adapters/http/responses';
import { validate } from '../../../src/adapters/http/validation';
import { requireAdmin } from '../../../src/adapters/http/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const createSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  role: z.enum(['admin', 'employee']).default('employee'),
  password: z.string().min(8)
});

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const employers = await container.employerUseCase.listEmployers();
    return json({ data: employers });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin(request);
    const input = validate(createSchema, await request.json());
    const employer = await container.employerUseCase.createEmployer({
      ...input,
      role: input.role ?? 'employee'
    });
    return json({ data: employer }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
