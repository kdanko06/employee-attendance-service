import bcrypt from 'bcrypt';
import { PasswordHasherPort } from '../../domain/ports/passwordHasher';

export class BcryptHasher implements PasswordHasherPort {
  constructor(private readonly saltRounds = 10) {}

  async compare(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }

  async hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, this.saltRounds);
  }
}
