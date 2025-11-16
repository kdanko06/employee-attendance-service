import { EmployerEntity, EmployerRole } from '../../domain/entities/employer';
import {
  EmployerAuthRecord,
  EmployerRepositoryPort
} from '../../domain/ports/employerRepository';
import { jsonDb, EmployerRecord } from './jsonStore';
import { HttpError } from '../../domain/errors';

const toEntity = (record: EmployerRecord): EmployerEntity => ({
  id: record.id,
  email: record.email,
  name: record.name,
  role: record.role,
  createdAt: new Date(record.createdAt)
});

export class JsonEmployerRepository implements EmployerRepositoryPort {
  async findByEmail(email: string): Promise<EmployerAuthRecord | null> {
    return jsonDb.readOnly((state) => {
      const record = state.employers.find((employer) => employer.email === email);
      if (!record) {
        return null;
      }
      return { ...toEntity(record), passwordHash: record.passwordHash };
    });
  }

  async findById(id: string): Promise<EmployerEntity | null> {
    return jsonDb.readOnly((state) => {
      const record = state.employers.find((employer) => employer.id === id);
      return record ? toEntity(record) : null;
    });
  }

  async list(): Promise<EmployerEntity[]> {
    return jsonDb.readOnly((state) =>
      [...state.employers]
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
        .map(toEntity)
    );
  }

  async create(input: {
    email: string;
    name: string;
    role: EmployerRole;
    passwordHash: string;
  }): Promise<EmployerEntity> {
    return jsonDb.transaction((state) => {
      const now = new Date().toISOString();
      const record: EmployerRecord = {
        id: jsonDb.generateId(),
        email: input.email,
        name: input.name,
        role: input.role,
        passwordHash: input.passwordHash,
        createdAt: now,
        updatedAt: now
      };
      state.employers.push(record);
      return toEntity(record);
    });
  }

  async update(
    id: string,
    input: Partial<Pick<EmployerEntity, 'name' | 'role'>>
  ): Promise<EmployerEntity> {
    return jsonDb.transaction((state) => {
      const record = state.employers.find((employer) => employer.id === id);
      if (!record) {
        throw new HttpError(404, 'Employer not found');
      }
      if (input.name) record.name = input.name;
      if (input.role) record.role = input.role;
      record.updatedAt = new Date().toISOString();
      return toEntity(record);
    });
  }

  async delete(id: string): Promise<void> {
    await jsonDb.transaction((state) => {
      const before = state.employers.length;
      state.employers = state.employers.filter((employer) => employer.id !== id);
      state.shifts = state.shifts.filter((shift) => shift.employerId !== id);
      if (before === state.employers.length) {
        throw new HttpError(404, 'Employer not found');
      }
      return undefined;
    });
  }
}
