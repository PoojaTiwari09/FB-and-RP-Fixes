import { M08TaskService } from '../services/task.service';
export declare class M08TaskEventSubscriber {
    private readonly taskService;
    constructor(taskService: M08TaskService);
    onCallTranscriptionCompleted(payload: Record<string, unknown>): Promise<void>;
}
