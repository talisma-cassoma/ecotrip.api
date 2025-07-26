import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { TripDto } from '../../trips/dto/trip.dto';
import { NewTripService } from '../../trips/new-trip/new-trip.service';
import { PrismaService } from '../../prisma/prisma.service';
import { DriverDto } from './dto/driver.dto';
import { OnEvent } from '@nestjs/event-emitter';
import { ObjectId } from 'bson';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class DriverGateway {
  @WebSocketServer()
  server: Server; // <- Isso é necessário para emitir eventos manualmente

  constructor(
    private newTripService: NewTripService,
    private prismaService: PrismaService
  ) { }

  @SubscribeMessage('client:requested-trips')
  async handletRequestedTrips(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: {
      driver_id: string;
    },
  ) {

    //verificar se  driver_id existe 

    //pegar as trips
    const newTrips: TripDto[] = await this.newTripService.getNewTrips()
    //comunicar ao driver
    this.server.emit(`server:requested-trips`, {
      newTrips
    });
  }

  @SubscribeMessage('client:accept-trip') //o driver aceitou
  async handletAcceptedTrip(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: {
      tripId: string,
      driver: any
    },
  ) {
    const { tripId, driver } = payload
    //registrar interesse
    console.log("entrei no gateways com a tripID:", tripId, "e o driver:", driver)

    // const relation = await this.prismaService.tripInterest.create({
    //   data: {
    //     trip_id: tripId,
    //     driver_id: driver.id
    //   }
    // }); //o problema esta aqui

    
    //pegar os drivers interessados
    // const availableDrives = await this.prismaService.trip.findUnique({
    //   where: { id: tripId },
    //   include: {
    //     interests: {
    //       include: {
    //         driver: true
    //       }
    //     }
    //   }
    // });

    // console.log("peguei of drivers availabes :", availableDrives)
    // if (!availableDrives) {
    //   client.emit(`server:available-drivers/${tripId}`, {});
    // }

    // const availableDrivesDto: DriverDto[] = availableDrives.interests.map((interest) => ({
    //   id: interest.driver.id,
    //   name: interest.driver.name,
    //   image: interest.driver.image,
    //   telephone: interest.driver.telephone,
    //   carModel: interest.driver.carModel,
    //   carPlate: interest.driver.carPlate,
    //   carColor: interest.driver.carColor,
    //   rating: interest.driver.rating,
    //   complited_rides: interest.driver.complited_rides,
    //   status: interest.driver.status,
    // }));

    const drivers = driver
    this.server.emit(`server:available-drivers/${tripId}`, driver);
  }
  @OnEvent('trip.created')
  async handleNewTripEvent() {
    const newTrips: TripDto[] = await this.newTripService.getNewTrips();

    this.server.emit('server:requested-trips', {
      newTrips,
    });
  }
}
