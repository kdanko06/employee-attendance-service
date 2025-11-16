export interface AuditLogRepositoryPort {
  create(input: {
    employerId?: string;
    action: string;
    metadata?: Record<string, unknown>;
  }): Promise<void>;
}
