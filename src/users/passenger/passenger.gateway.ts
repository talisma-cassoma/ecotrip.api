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
import * as jwt from 'jsonwebtoken';
import { NewTripService } from 'src/trips/new-trip/new-trip.service';

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
    private newTripService: NewTripService,
    private prismaService: PrismaService

  ) { }

  @SubscribeMessage('client:available-drivers')
  async handleAvailableDriversRequest(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: {
      passenger_id: string;
      trip_id: string;
    },
  ) {
    const { passenger_id, trip_id } = payload;
    console.log("trip id:", trip_id)
    try {

      // const payload: jwt.JwtPayload = this.newTripService.verifyPublicTripToken(trip_id);
      // console.log("trip token:", payload.tripToken)
      // const trip = await this.prismaService.trip.findUnique({
      //   where: { token: payload.tripToken },
      //   include: { passenger: true, driver: { include: { user: true } } }
      // });


      const room = `trip:${trip_id}`;
      client.join(room);

      const roomInfo = this.server.sockets.adapter.rooms.get(room);
      if (roomInfo?.has(client.id)) {
        console.log(`✅ Cliente ${client.id} está na sala ${room}`);
      } else {
        console.log(`❌ Cliente ${client.id} NÃO está na sala ${room}`);
      }

      // emitir para todos na sala
      //this.server.to(room).emit('trip:message', { msg: 'Bem-vindo à sala' });

    } catch (error) {
      console.error('Erro ao verificar viagem:', error);
      this.server.emit(`server:available-drivers/${trip_id}`, {
        error: 'Viagem inválida ou não encontrada.',
      });
    }
  }
}
