import { EmployerEntity, EmployerRole } from '../entities/employer';

export interface EmployerAuthRecord extends EmployerEntity {
  passwordHash: string;
}

export interface EmployerRepositoryPort {
  findByEmail(email: string): Promise<EmployerAuthRecord | null>;
  findById(id: string): Promise<EmployerEntity | null>;
  list(): Promise<EmployerEntity[]>;
  create(input: {
    email: string;
    name: string;
    role: EmployerRole;
    passwordHash: string;
  }): Promise<EmployerEntity>;
  update(
    id: string,
    input: Partial<Pick<EmployerEntity, 'name' | 'role'>>
  ): Promise<EmployerEntity>;
  delete(id: string): Promise<void>;
}
