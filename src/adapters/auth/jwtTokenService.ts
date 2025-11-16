import jwt, { SignOptions } from 'jsonwebtoken';
import {
  TokenPayload,
  TokenServicePort
} from '../../domain/ports/tokenService';
import { env } from '../../config/env';

export class JwtTokenService implements TokenServicePort {
  async sign(
    payload: TokenPayload,
    options?: { expiresIn?: string | number }
  ): Promise<string> {
    const expiresIn = (options?.expiresIn ?? '1h') as SignOptions['expiresIn'];
    return jwt.sign(payload, env.JWT_SECRET, { expiresIn });
  }

  async verify(token: string): Promise<TokenPayload> {
    return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
  }
}
