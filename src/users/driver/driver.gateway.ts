import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { TripDto } from '../../trips/dto/trip.dto';
import { NewTripService } from '../../trips/new-trip/new-trip.service';
import { PrismaService } from '../../prisma/prisma.service';
import { DriverDto } from './dto/driver.dto';
import { OnEvent } from '@nestjs/event-emitter';
import { WsJwtGuard } from 'src/auth/ws-jwt-auth.guard';

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
  //@UseGuards(WsJwtGuard)
  @SubscribeMessage('client:requested-trips')
  async handletRequestedTrips(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: {
      driver_id: string;
    },
  ) {

    //verificar se  driver_id existe 
    const driver_id = payload.driver_id;
    if (!driver_id) {
      client.emit('server:error', { message: 'Driver ID is required.' });
      return;
    }
    //pegar as trips
    const newTrips: TripDto[] = await this.newTripService.getNewTrips()
    //comunicar ao driver
    this.server.emit(`server:requested-trips`, {
      newTrips: newTrips,
    });
  }

  //@UseGuards(WsJwtGuard)
  @SubscribeMessage('client:accept-trip') //o driver aceitou
  async handletAcceptedTrip(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: {
      trip_id: string,
      driver_email: string
    },
  ) {
    const { trip_id, driver_email } = payload
    //registrar interesse
    console.log("entrei no gateways com a trip_id:", trip_id, "e o driver:", driver_email)

    if (!trip_id || !driver_email) {
      client.emit('server:error', { message: 'Trip ID and Driver ID are required.' });
      return;
    }
    try {

      const driver = await this.prismaService.user.findUnique({
        where: {
          email: driver_email
        },
        include: {
          driver: true
        }
      })
      const updatedTrip = await this.prismaService.trip.update({
        where: { token: trip_id },
        data: {
          interested_driver_ids: {
            push: driver.id
          }
        },
        select: {
          interested_driver_ids: true
        }
      });

      const interestedDrivers = await this.prismaService.driver.findMany({
        where: {
          id: { in: updatedTrip.interested_driver_ids }
        },
        include: { user: true }
      });

      console.log("peguei of drivers availabes :", interestedDrivers)
      if (!interestedDrivers || interestedDrivers.length === 0) {
        client.emit(`server:available-drivers/${trip_id}`, {});
      }

      const interestedDriversDto: DriverDto[] = interestedDrivers.map((interest) => ({
        //acess_token: interest.user.access_token,
        user: {
          email: interest.user.email,
          name: interest.user.name,
          image: interest.user.image,
          telephone: interest.user.telephone,
          carModel: interest.car_model,
          carPlate: interest.car_plate,
          carColor: interest.car_color,
          rating: interest.rating,
          complited_rides: interest.completed_rides,
          status: interest.status,
        }
      }));

      client.join(`trip:${trip_id}`); // agora o driver entra na sala
      this.server.to(`trip:${trip_id}`).emit('server:available-drivers', interestedDriversDto);

    } catch (err) {
      client.emit('server:error', { message: 'Trip not found or update failed.' });
    }
  }
  @OnEvent('trip.created')
  async handleNewTripEvent() {
    const newTrips: TripDto[] = await this.newTripService.getNewTrips();

    this.server.emit('server:requested-trips', {
      newTrips,
    });
  }
}
