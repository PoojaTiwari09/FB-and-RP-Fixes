import { Queue } from 'bullmq';
export declare class EventPublisherService {
    private queue;
    constructor(queue: Queue);
    publish(eventName: string, payload: Record<string, any>): Promise<void>;
}
