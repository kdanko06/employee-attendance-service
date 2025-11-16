import { ShiftEntity } from '../entities/shift';

export interface ShiftRepositoryPort {
  findOpenShiftForEmployer(employerId: string): Promise<ShiftEntity | null>;
  createShift(input: {
    employerId: string;
    startedAt: Date;
    startTz: string;
    notes?: string;
  }): Promise<ShiftEntity>;
  completeShift(
    shiftId: string,
    input: { endedAt: Date; endTz: string; notes?: string }
  ): Promise<ShiftEntity>;
  listShifts(filters?: { employerId?: string }): Promise<ShiftEntity[]>;
  updateShift(
    shiftId: string,
    input: Partial<Pick<ShiftEntity, 'startedAt' | 'endedAt' | 'notes' | 'startTz' | 'endTz'>>
  ): Promise<ShiftEntity>;
  deleteShift(id: string): Promise<void>;
}
