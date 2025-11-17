import bcrypt from 'bcrypt';
import { jsonDb, DatabaseState, EmployerRecord } from '../src/adapters/db/jsonStore';

async function ensureEmployer(state: DatabaseState, input: {
  email: string;
  name: string;
  role: 'admin' | 'employee';
  password: string;
}): Promise<EmployerRecord> {
  const existing = state.employers.find((employer) => employer.email === input.email);
  if (existing) {
    console.log(`${input.role} user already exists: ${input.email}`);
    return existing;
  }

  const now = new Date().toISOString();
  const passwordHash = await bcrypt.hash(input.password, 10);
  const employer: EmployerRecord = {
    id: jsonDb.generateId(),
    email: input.email,
    name: input.name,
    role: input.role,
    passwordHash,
    createdAt: now,
    updatedAt: now
  };
  state.employers.push(employer);
  console.log(`Seeded ${input.role} user:`, { email: input.email, password: input.password });
  return employer;
}

function ensureShift(state: DatabaseState, input: {
  employerId: string;
  startedAt: Date;
  endedAt?: Date | null;
  startTz: string;
  endTz?: string | null;
  notes?: string;
}) {
  const startedAtIso = input.startedAt.toISOString();
  const existing = state.shifts.find(
    (shift: any) => shift.employerId === input.employerId && shift.startedAt === startedAtIso
  );
  if (existing) {
    return;
  }
  state.shifts.push({
    id: jsonDb.generateId(),
    employerId: input.employerId,
    startedAt: startedAtIso,
    startTz: input.startTz,
    endedAt: input.endedAt ? input.endedAt.toISOString() : null,
    endTz: input.endTz ?? (input.endedAt ? input.startTz : null),
    notes: input.notes ?? null,
    updatedAt: new Date().toISOString()
  });
}

async function main() {
  const timezone = 'Australia/Sydney';
  await jsonDb.transaction(async (state) => {
    const admin = await ensureEmployer(state, {
      email: 'admin@example.com',
      name: 'Default Admin',
      role: 'admin',
      password: 'Admin123!'
    });

    const worker = await ensureEmployer(state, {
      email: 'worker@example.com',
      name: 'Sample Worker',
      role: 'employee',
      password: 'Worker123!'
    });

    if (worker) {
      const pastShiftStart = new Date();
      pastShiftStart.setDate(pastShiftStart.getDate() - 2);
      pastShiftStart.setHours(9, 0, 0, 0);
      const pastShiftEnd = new Date(pastShiftStart);
      pastShiftEnd.setHours(17, 0, 0, 0);

      const currentShiftStart = new Date();
      currentShiftStart.setHours(8, 30, 0, 0);

      ensureShift(state, {
        employerId: worker.id,
        startedAt: pastShiftStart,
        endedAt: pastShiftEnd,
        startTz: timezone,
        endTz: timezone,
        notes: 'Day shift (completed)'
      });

      ensureShift(state, {
        employerId: worker.id,
        startedAt: currentShiftStart,
        startTz: timezone,
        notes: 'Current open shift'
      });
    }

    if (admin && worker) {
      console.log('Seed data ready: admin + worker with sample shifts.');
    }
  });
}

main().catch((error) => {
  console.error('Failed to seed data store', error);
  process.exit(1);
});
