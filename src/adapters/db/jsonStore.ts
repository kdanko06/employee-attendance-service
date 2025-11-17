import { promises as fs } from 'fs';
import { dirname, resolve } from 'path';
import { Mutex } from 'async-mutex';
import { randomUUID } from 'crypto';
import { env } from '../../config/env';

export interface EmployerRecord {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'employee';
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
}

export interface ShiftRecord {
  id: string;
  employerId: string;
  startedAt: string;
  startTz: string;
  endedAt?: string | null;
  endTz?: string | null;
  notes?: string | null;
  updatedAt: string;
}

export interface AuditLogRecord {
  id: string;
  employerId?: string | null;
  action: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface DatabaseState {
  employers: EmployerRecord[];
  shifts: ShiftRecord[];
  auditLogs: AuditLogRecord[];
}

const defaultState: DatabaseState = {
  employers: [],
  shifts: [],
  auditLogs: []
};

class JsonFileDatabase {
  private readonly filePath = resolve(process.cwd(), env.DATA_FILE_PATH);
  private readonly mutex = new Mutex();
  private initialized = false;

  private async ensureFile(): Promise<void> {
    if (this.initialized) {
      return;
    }
    this.initialized = true;
    try {
      await fs.access(this.filePath);
    } catch {
      await fs.mkdir(dirname(this.filePath), { recursive: true });
      await fs.writeFile(this.filePath, JSON.stringify(defaultState, null, 2));
    }
  }

  private async read(): Promise<DatabaseState> {
    await this.ensureFile();
    const data = await fs.readFile(this.filePath, 'utf-8');
    return JSON.parse(data) as DatabaseState;
  }

  private async write(state: DatabaseState): Promise<void> {
    await this.ensureFile();
    await fs.writeFile(this.filePath, JSON.stringify(state, null, 2));
  }

  async readOnly<T>(selector: (state: DatabaseState) => T | Promise<T>): Promise<T> {
    return this.mutex.runExclusive(async () => {
      const state = await this.read();
      return selector(state);
    });
  }

  async transaction<T>(mutator: (state: DatabaseState) => Promise<T> | T): Promise<T> {
    return this.mutex.runExclusive(async () => {
      const state = await this.read();
      const result = await mutator(state);
      await this.write(state);
      return result;
    });
  }

  generateId() {
    return randomUUID();
  }
}

export const jsonDb = new JsonFileDatabase();
