import { Module } from '@nestjs/common';
import { DriverController } from './driver/driver.controller';
import { DriverService } from './driver/driver.service';
import { DriverGateway } from './driver/driver.gateway';
import { PassengerController } from './passenger/passenger.controller';
import { PassengerService } from './passenger/passenger.service';
import { PassengerGateway } from './passenger/passenger.gateway';
import { NewTripService } from 'src/trips/new-trip/new-trip.service';
import { NewTripController } from 'src/trips/new-trip/new-trip.controller';
import { SupabaseAuthService } from 'src/supasbase/supasbase.service';
import { JwtService } from '@nestjs/jwt';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';


@Module({
  controllers: [DriverController, PassengerController, NewTripController, UsersController],
  providers: [
    DriverService,
    DriverGateway,
    PassengerService,
    PassengerGateway,
    NewTripService,
    SupabaseAuthService,
  JwtService,
  UsersService]
})
export class UsersModule { }
