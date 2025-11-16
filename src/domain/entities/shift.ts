export interface ShiftEntity {
  id: string;
  employerId: string;
  startedAt: Date;
  startTz: string;
  endedAt?: Date | null;
  endTz?: string | null;
  notes?: string | null;
  updatedAt: Date;
}
