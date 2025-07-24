import { Module } from '@nestjs/common';
import { DriverController } from './driver/driver.controller';
import { DriverService } from './driver/driver.service';
import { DriverGateway } from './driver/driver.gateway';
import { PassengerController } from './passenger/passenger.controller';
import { PassengerService } from './passenger/passenger.service';
import { PassengerGateway } from './passenger/passenger.gateway';
import { NewTripService } from 'src/trips/new-trip/new-trip.service';
import { NewTripController } from 'src/trips/new-trip/new-trip.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [DriverController, PassengerController, NewTripController],
  providers: [DriverService, DriverGateway, PassengerService, PassengerGateway, NewTripService]
})
export class UsersModule {}
