import { FileQueueAdapter } from '../src/adapters/queue/fileQueueAdapter';
import { JsonAuditLogRepository } from '../src/adapters/db/auditLogRepository';
import { logger } from '../src/config/logger';

const queue = new FileQueueAdapter();
const auditRepo = new JsonAuditLogRepository();

async function main() {
  logger.info('worker:logs started');
  await queue.consume('audit:jobs', async (payload) => {
    const action = (payload.action as string) ?? 'unknown';
    await auditRepo.create({
      employerId: payload.employerId as string | undefined,
      action,
      metadata: payload
    });
    logger.info({ action }, 'Stored audit log');
  });
}

main().catch((error) => {
  logger.error({ err: error }, 'worker:logs crashed');
  process.exit(1);
});
