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
      requestedTripList: TripDto[];
    },
  ) {
    const newTrips = await this.newTripService.getNewTrips()
    client.emit(`server:requested-trips`, {
      newTrips
    });
  }

  @SubscribeMessage('client:accept-trip') //driver aceitou
  async handletAcceptedTrip(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: {
      tripId: string,
      driver: DriverDto
    },
  ) {
    const { tripId, driver } = payload
    //registrar interesse
    await this.prismaService.tripInterest.create({
      data: {
        trip: { connect: { id: tripId } },
        driver: { connect: { id: driver.id } }
      }
    });

    //pegar os drivers interessados
    const availableDrives = await this.prismaService.trip.findUnique({
      where: { id: tripId },
      include: {
        interests: {
          include: {
            driver: true
          }
        }
      }
    });

    if (!availableDrives) {
      client.emit(`server:available-drivers/${tripId}`, {});
    }

    const availableDrivesDto: DriverDto[] = availableDrives.interests.map((interest) => ({
      id: interest.driver.id,
      name: interest.driver.name,
      image: interest.driver.image,
      telephone: interest.driver.telephone,
      carModel: interest.driver.carModel,
      carPlate: interest.driver.carPlate,
      carColor: interest.driver.carColor,
      rating: interest.driver.rating,
      complited_rides: interest.driver.complited_rides,
      status: interest.driver.status,
    }));

    client.emit(`server:available-drivers/${tripId}`, {
      availableDrivesDto
    });
  }
}
