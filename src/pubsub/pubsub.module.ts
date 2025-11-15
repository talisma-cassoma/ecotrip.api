// pubsub.module.ts
import { Module } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Module({
  providers: [
    {
      provide: 'ROOMS_PUBSUB',
      useFactory: () => new EventEmitter2(),
    },
  ],
  exports: ['ROOMS_PUBSUB'],
})
export class PubsubModule {}
