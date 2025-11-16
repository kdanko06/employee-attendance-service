import { sleep } from '../../utils/sleep';
import { QueuePort } from '../../domain/ports/queuePort';
import { jsonDb, QueueJobRecord } from '../db/jsonStore';
import { logger } from '../../config/logger';

export class FileQueueAdapter implements QueuePort {
  async enqueue(topic: string, payload: Record<string, unknown>): Promise<void> {
    await jsonDb.transaction((state) => {
      if (!state.queues[topic]) {
        state.queues[topic] = [];
      }
      const record: QueueJobRecord = {
        id: jsonDb.generateId(),
        payload,
        enqueuedAt: new Date().toISOString()
      };
      state.queues[topic].push(record);
      return undefined;
    });
  }

  private async dequeue(topic: string): Promise<QueueJobRecord | null> {
    return jsonDb.transaction((state) => {
      const queue = state.queues[topic] ?? [];
      const job = queue.shift() ?? null;
      return job;
    });
  }

  async consume(
    topic: string,
    handler: (payload: Record<string, unknown>) => Promise<void>
  ): Promise<void> {
    for (;;) {
      const job = await this.dequeue(topic);
      if (!job) {
        await sleep(500);
        continue;
      }
      try {
        await handler(job.payload);
      } catch (error) {
        logger.error({ err: error, topic }, 'Failed to process queue payload');
      }
    }
  }
}
