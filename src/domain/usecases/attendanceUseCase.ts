import { ShiftRepositoryPort } from '../ports/shiftRepository';
import { QueuePort } from '../ports/queuePort';
import { HttpError } from '../errors';
import { ShiftEntity } from '../entities/shift';

interface SignInInput {
  employerId: string;
  timezone: string;
  notes?: string;
}

interface SignOffInput {
  employerId: string;
  timezone: string;
  notes?: string;
}

export class AttendanceUseCase {
  constructor(
    private readonly shifts: ShiftRepositoryPort,
    private readonly queue: QueuePort
  ) {}

  async signIn(input: SignInInput): Promise<ShiftEntity> {
    const openShift = await this.shifts.findOpenShiftForEmployer(input.employerId);
    if (openShift) {
      throw new HttpError(400, 'You already have an active shift');
    }

    const shift = await this.shifts.createShift({
      employerId: input.employerId,
      startedAt: new Date(),
      startTz: input.timezone,
      notes: input.notes
    });

    await this.queue.enqueue('audit:jobs', {
      action: 'attendance.sign-in',
      employerId: input.employerId,
      shiftId: shift.id
    });

    return shift;
  }

  async signOff(input: SignOffInput): Promise<ShiftEntity> {
    const openShift = await this.shifts.findOpenShiftForEmployer(input.employerId);
    if (!openShift) {
      throw new HttpError(400, 'No open shift to sign off');
    }

    const shift = await this.shifts.completeShift(openShift.id, {
      endedAt: new Date(),
      endTz: input.timezone,
      notes: input.notes ?? openShift.notes ?? undefined
    });

    await this.queue.enqueue('audit:jobs', {
      action: 'attendance.sign-off',
      employerId: input.employerId,
      shiftId: shift.id
    });

    return shift;
  }

  listShifts(filters?: { employerId?: string }): Promise<ShiftEntity[]> {
    return this.shifts.listShifts(filters);
  }

  async updateShift(
    shiftId: string,
    updates: Partial<Pick<ShiftEntity, 'startedAt' | 'endedAt' | 'notes' | 'startTz' | 'endTz'>>
  ): Promise<ShiftEntity> {
    const shift = await this.shifts.updateShift(shiftId, updates);
    await this.queue.enqueue('audit:jobs', {
      action: 'attendance.shift-updated',
      shiftId,
      updates
    });
    return shift;
  }

  async deleteShift(shiftId: string): Promise<void> {
    await this.shifts.deleteShift(shiftId);
    await this.queue.enqueue('audit:jobs', {
      action: 'attendance.shift-deleted',
      shiftId
    });
  }
}
