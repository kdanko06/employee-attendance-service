import { EmployerRepositoryPort } from '../ports/employerRepository';
import { PasswordHasherPort } from '../ports/passwordHasher';
import { TokenServicePort } from '../ports/tokenService';
import { HttpError } from '../errors';
import { AuditLogRepositoryPort } from '../ports/auditLogRepository';

interface LoginInput {
  email: string;
  password: string;
}

export class AuthUseCase {
  constructor(
    private readonly repo: EmployerRepositoryPort,
    private readonly hasher: PasswordHasherPort,
    private readonly tokens: TokenServicePort,
    private readonly auditLogs: AuditLogRepositoryPort
  ) {}

  async login(input: LoginInput) {
    const employer = await this.repo.findByEmail(input.email);
    if (!employer) {
      throw new HttpError(401, 'Invalid credentials');
    }

    const valid = await this.hasher.compare(input.password, employer.passwordHash);
    if (!valid) {
      throw new HttpError(401, 'Invalid credentials');
    }

    const accessToken = await this.tokens.sign({ sub: employer.id, role: employer.role });
    await this.auditLogs.create({
      action: 'auth.login',
      employerId: employer.id,
      metadata: { email: employer.email }
    });

    return {
      accessToken,
      employer: {
        id: employer.id,
        email: employer.email,
        name: employer.name,
        role: employer.role,
        createdAt: employer.createdAt
      }
    };
  }
}
