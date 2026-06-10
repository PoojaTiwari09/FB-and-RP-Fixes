import { EventEmitter2 } from '@nestjs/event-emitter';
export declare class EventPublisherService {
    private readonly emitter;
    private readonly logger;
    constructor(emitter: EventEmitter2);
    publish(eventName: string, payload: Record<string, any>): Promise<void>;
}
