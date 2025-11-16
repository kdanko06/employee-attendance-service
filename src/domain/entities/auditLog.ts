export interface AuditLogEntity {
  id: string;
  employerId?: string | null;
  action: string;
  metadata?: Record<string, unknown> | null;
  createdAt: Date;
}
