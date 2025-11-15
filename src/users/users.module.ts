import { Module } from '@nestjs/common';
import { DriverController } from './driver/driver.controller';
import { DriverService } from './driver/driver.service';
import { PassengerController } from './passenger/passenger.controller';
import { PassengerService } from './passenger/passenger.service';

import { NewTripService } from 'src/trips/new-trip/new-trip.service';
import { NewTripController } from 'src/trips/new-trip/new-trip.controller';
import { SupabaseAuthService } from 'src/supasbase/supasbase.service';
import { JwtService } from '@nestjs/jwt';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { race } from 'rxjs';
//import { RabbitmqService } from 'src/rabbitmq/rabbitmq.service';
import { PubsubModule } from 'src/pubsub/pubsub.module';


@Module({
  imports: [PubsubModule],
  controllers: [DriverController, PassengerController, NewTripController, UsersController],
  providers: [
    DriverService,  
    PassengerService,
    NewTripService,
    SupabaseAuthService,
    JwtService,
    UsersService,
    
    //RabbitmqService
  ]
})
export class UsersModule { }
