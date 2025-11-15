import { Module } from '@nestjs/common';
import { NewTripController } from './new-trip/new-trip.controller';
import { NewTripService } from './new-trip/new-trip.service';
import { PubsubModule } from 'src/pubsub/pubsub.module';

@Module({
  imports: [PubsubModule],
  controllers: [NewTripController],
  providers: [NewTripService]
})
export class TripsModule {}
