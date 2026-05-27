import { Global, Module } from '@nestjs/common';
import { EventPublisherService } from './event-publisher.service';

/**
 * EventPublisherModule
 *
 * Marked @Global so any module can inject EventPublisherService without
 * needing to import this module explicitly. The underlying EventEmitter2
 * is initialised once at the AppModule root (see apps/api/src/app.module.ts)
 * with EventEmitterModule.forRoot(). That keeps the registration to a single
 * call across the whole process and lets @OnEvent subscribers fire in every
 * module that participates in the domain event bus (M01 → M02/M03/M05/M10).
 */
@Global()
@Module({
  providers: [EventPublisherService],
  exports: [EventPublisherService],
})
export class EventPublisherModule {}
