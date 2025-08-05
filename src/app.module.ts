import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MapsModule } from './maps/maps.module';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { TripsModule } from './trips/trips.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { SupasbaseModule } from './supasbase/supasbase.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    MapsModule,
    UsersModule,
    TripsModule,
    //RoutesModule,
    //KafkaModule,
    EventEmitterModule.forRoot(),
    SupasbaseModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

//container de serviços
