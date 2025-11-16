import { JwtTokenService } from '../auth/jwtTokenService';
import { HttpError } from './errors';
import { TokenPayload } from '../../domain/ports/tokenService';

const tokenService = new JwtTokenService();

export type AuthContext = TokenPayload;

const TOKEN_PREFIX = 'bearer ';

export async function requireAuth(request: Request): Promise<AuthContext> {
  const header = request.headers.get('authorization');
  if (!header) {
    throw new HttpError(401, 'Missing Authorization header');
  }

  if (!header.toLowerCase().startsWith(TOKEN_PREFIX)) {
    throw new HttpError(401, 'Invalid Authorization header');
  }

  const token = header.substring(TOKEN_PREFIX.length).trim();
  if (!token) {
    throw new HttpError(401, 'Missing bearer token');
  }

  try {
    return await tokenService.verify(token);
  } catch (error) {
    throw new HttpError(401, 'Invalid or expired token');
  }
}

export async function requireAdmin(request: Request): Promise<AuthContext> {
  const auth = await requireAuth(request);
  if (auth.role !== 'admin') {
    throw new HttpError(403, 'Admin role required');
  }
  return auth;
}
