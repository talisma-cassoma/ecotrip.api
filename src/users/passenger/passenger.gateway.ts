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
      console.log("id:", passengerId)
      // Se a trip é válida, busca motoristas disponíveis
      await this.driversService.shareRequestedTrips();

    } catch (error) {
      console.error('Erro ao verificar viagem:', error);
      this.server.emit(`server:available-drivers/${payload.tripId}`, {
        error: 'Viagem inválida ou não encontrada.',
      });
    }
  }
}
