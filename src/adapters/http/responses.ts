import { NextResponse } from 'next/server';
import { HttpError } from './errors';
import { logger } from '../../config/logger';

export const json = (
  data: unknown,
  init?: { status?: number }
) => NextResponse.json(data, init);

export function handleRouteError(error: unknown) {
  if (error instanceof HttpError) {
    return json(
      { error: error.message, details: error.details ?? null },
      { status: error.status }
    );
  }

  logger.error({ err: error }, 'Unhandled route error');
  return json({ error: 'Internal server error' }, { status: 500 });
}
