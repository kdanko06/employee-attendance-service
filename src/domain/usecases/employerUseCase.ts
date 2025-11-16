import { EmployerEntity, EmployerRole } from '../entities/employer';
import { EmployerRepositoryPort } from '../ports/employerRepository';
import { PasswordHasherPort } from '../ports/passwordHasher';
import { QueuePort } from '../ports/queuePort';
import { HttpError } from '../errors';

interface CreateEmployerInput {
  email: string;
  name: string;
  role: EmployerRole;
  password: string;
}

interface UpdateEmployerInput {
  name?: string;
  role?: EmployerRole;
}

export class EmployerUseCase {
  constructor(
    private readonly repo: EmployerRepositoryPort,
    private readonly hasher: PasswordHasherPort,
    private readonly queue: QueuePort
  ) {}

  async createEmployer(input: CreateEmployerInput): Promise<EmployerEntity> {
    const existing = await this.repo.findByEmail(input.email);
    if (existing) {
      throw new HttpError(409, 'Employer already exists');
    }

    const passwordHash = await this.hasher.hash(input.password);
    const employer = await this.repo.create({
      email: input.email,
      name: input.name,
      role: input.role,
      passwordHash
    });

    await this.queue.enqueue('audit:jobs', {
      action: 'employer.created',
      employerId: employer.id,
      role: employer.role
    });

    return employer;
  }

  listEmployers(): Promise<EmployerEntity[]> {
    return this.repo.list();
  }

  async getEmployer(id: string): Promise<EmployerEntity> {
    const employer = await this.repo.findById(id);
    if (!employer) {
      throw new HttpError(404, 'Employer not found');
    }
    return employer;
  }

  async updateEmployer(id: string, input: UpdateEmployerInput): Promise<EmployerEntity> {
    const employer = await this.repo.update(id, input);
    await this.queue.enqueue('audit:jobs', {
      action: 'employer.updated',
      employerId: employer.id,
      changes: input
    });
    return employer;
  }

  async deleteEmployer(id: string): Promise<void> {
    await this.repo.delete(id);
    await this.queue.enqueue('audit:jobs', {
      action: 'employer.deleted',
      employerId: id
    });
  }

  async getProfile(id: string): Promise<EmployerEntity> {
    return this.getEmployer(id);
  }
}
