import { z } from 'zod';
import { container } from '../../../../src/config/container';
import { handleRouteError, json } from '../../../../src/adapters/http/responses';
import { validate } from '../../../../src/adapters/http/validation';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const input = validate(schema, await request.json());
    const result = await container.authUseCase.login(input);
    return json(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
