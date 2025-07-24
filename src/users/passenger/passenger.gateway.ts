import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { DriverService } from '../driver/driver.service';
import { PassengerService } from './passenger.service';
import { TripDto } from 'src/trips/dto/trip.dto';
import { DriverDto } from '../driver/dto/driver.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class PassengerGateway {
  @WebSocketServer()
  server: Server;

  constructor(
    private driversService: DriverService,
    private passengerService: PassengerService,
    private prismaService: PrismaService
  ) { }

  @SubscribeMessage('client:available-drivers')
  async handleAvailableDriversRequest(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: {
      passengerId: string;
      tripId: string;
    },
  ) {
    const { passengerId, tripId } = payload;

    let trip: TripDto
    try {
      trip = await this.passengerService.verifyPassengerTrip(
        tripId,
        passengerId,
      );

      // Se a trip é válida, busca motoristas disponíveis
      await this.driversService.shareRequestedTrips();

    } catch (error) {
      // Se a viagem não existir ou não pertencer ao passageiro
      client.emit(`server:available-drivers/${trip.id}`, {
        error: 'Viagem inválida ou não encontrada.',
      });
    }
  }
}
