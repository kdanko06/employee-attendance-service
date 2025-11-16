import { AuditLogRepositoryPort } from '../../domain/ports/auditLogRepository';
import { jsonDb, AuditLogRecord } from './jsonStore';

export class JsonAuditLogRepository implements AuditLogRepositoryPort {
  async create(input: {
    employerId?: string | undefined;
    action: string;
    metadata?: Record<string, unknown> | undefined;
  }): Promise<void> {
    await jsonDb.transaction((state) => {
      const record: AuditLogRecord = {
        id: jsonDb.generateId(),
        employerId: input.employerId ?? null,
        action: input.action,
        metadata: input.metadata,
        createdAt: new Date().toISOString()
      };
      state.auditLogs.push(record);
      return undefined;
    });
  }
}
