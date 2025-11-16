export interface QueuePort<TPayload = Record<string, unknown>> {
  enqueue(topic: string, payload: TPayload): Promise<void>;
  consume(
    topic: string,
    handler: (payload: TPayload) => Promise<void>
  ): Promise<void>;
}
