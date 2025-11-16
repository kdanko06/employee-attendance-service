import { ShiftRepositoryPort } from '../../domain/ports/shiftRepository';
import { ShiftEntity } from '../../domain/entities/shift';
import { jsonDb, ShiftRecord } from './jsonStore';
import { HttpError } from '../../domain/errors';

const toEntity = (record: ShiftRecord): ShiftEntity => ({
  id: record.id,
  employerId: record.employerId,
  startedAt: new Date(record.startedAt),
  startTz: record.startTz,
  endedAt: record.endedAt ? new Date(record.endedAt) : null,
  endTz: record.endTz ?? null,
  notes: record.notes ?? null,
  updatedAt: new Date(record.updatedAt)
});

export class JsonShiftRepository implements ShiftRepositoryPort {
  async findOpenShiftForEmployer(employerId: string): Promise<ShiftEntity | null> {
    return jsonDb.readOnly((state) => {
      const record = state.shifts
        .filter((shift) => shift.employerId === employerId && !shift.endedAt)
        .sort((a, b) => (a.startedAt < b.startedAt ? 1 : -1))[0];
      return record ? toEntity(record) : null;
    });
  }

  async createShift(input: {
    employerId: string;
    startedAt: Date;
    startTz: string;
    notes?: string | undefined;
  }): Promise<ShiftEntity> {
    return jsonDb.transaction((state) => {
      const record: ShiftRecord = {
        id: jsonDb.generateId(),
        employerId: input.employerId,
        startedAt: input.startedAt.toISOString(),
        startTz: input.startTz,
        endedAt: null,
        endTz: null,
        notes: input.notes ?? null,
        updatedAt: new Date().toISOString()
      };
      state.shifts.push(record);
      return toEntity(record);
    });
  }

  async completeShift(
    shiftId: string,
    input: { endedAt: Date; endTz: string; notes?: string | undefined }
  ): Promise<ShiftEntity> {
    return jsonDb.transaction((state) => {
      const record = state.shifts.find((shift) => shift.id === shiftId);
      if (!record) {
        throw new HttpError(404, 'Shift not found');
      }
      record.endedAt = input.endedAt.toISOString();
      record.endTz = input.endTz;
      record.notes = input.notes ?? record.notes ?? null;
      record.updatedAt = new Date().toISOString();
      return toEntity(record);
    });
  }

  async listShifts(filters?: { employerId?: string }): Promise<ShiftEntity[]> {
    return jsonDb.readOnly((state) =>
      state.shifts
        .filter((shift) => (filters?.employerId ? shift.employerId === filters.employerId : true))
        .sort((a, b) => (a.startedAt < b.startedAt ? 1 : -1))
        .map(toEntity)
    );
  }

  async updateShift(
    shiftId: string,
    input: Partial<Pick<ShiftEntity, 'startedAt' | 'endedAt' | 'notes' | 'startTz' | 'endTz'>>
  ): Promise<ShiftEntity> {
    return jsonDb.transaction((state) => {
      const record = state.shifts.find((shift) => shift.id === shiftId);
      if (!record) {
        throw new HttpError(404, 'Shift not found');
      }
      if (input.startedAt) record.startedAt = input.startedAt.toISOString();
      if (input.endedAt) record.endedAt = input.endedAt.toISOString();
      if (input.notes !== undefined) record.notes = input.notes;
      if (input.startTz) record.startTz = input.startTz;
      if (input.endTz) record.endTz = input.endTz;
      record.updatedAt = new Date().toISOString();
      return toEntity(record);
    });
  }

  async deleteShift(id: string): Promise<void> {
    await jsonDb.transaction((state) => {
      const before = state.shifts.length;
      state.shifts = state.shifts.filter((shift) => shift.id !== id);
      if (before === state.shifts.length) {
        throw new HttpError(404, 'Shift not found');
      }
      return undefined;
    });
  }
}
