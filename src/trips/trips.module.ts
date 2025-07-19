import { Module } from '@nestjs/common';
import { NewTripController } from './new-trip/new-trip.controller';
import { NewTripService } from './new-trip/new-trip.service';

@Module({
  controllers: [NewTripController],
  providers: [NewTripService]
})
export class TripsModule {}
