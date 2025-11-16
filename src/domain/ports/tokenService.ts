export interface TokenPayload {
  sub: string;
  role: 'admin' | 'employee';
}

export interface TokenServicePort {
  sign(payload: TokenPayload, options?: { expiresIn?: string | number }): Promise<string>;
  verify(token: string): Promise<TokenPayload>;
}
