import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { TripDto } from '../dto/trip.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Role } from '@prisma/client';
import { UnauthorizedException, NotFoundException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class NewTripService {
  constructor(private prisma: PrismaService, private eventEmitter: EventEmitter2) { }

  async createTrip(data: any): Promise<{ tripId: string, message: string }> {
    try {
      // Validação mínima (opcional)
      if (!data.origin || !data.destination || !data.email || !data.price) {
        throw new BadRequestException('Campos obrigatórios ausentes.');
      }

      const passenger = await this.prisma.user.findUnique({
        where: { email: data.email },
      });

      const createdTrip = await this.prisma.trip.create({
        data: {
          source: data.origin,
          destination: data.destination,
          distance: data.distance,
          duration: data.duration,
          freight: data.price,
          directions: data.directions ?? {}, // se não vier, salva vazio
          status: 'requested',
          passenger_id: passenger.id,
        },
      });

      // comunicate the event to driver gateway === o quivalente a usar um system de fila 
      this.eventEmitter.emit('trip.created');

      //const trip_token = await this.generatePublicTripToken(createdTrip.token)
      return {
        tripId: createdTrip.token,
        message: 'Viagem criada com sucesso.',
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      console.error('Erro ao criar viagem:', error);
      throw new InternalServerErrorException('Erro ao criar a viagem.');
    }
  }

  async getNewTrips(): Promise<TripDto[]> {
    const requestedTrips = await this.prisma.trip.findMany({
      where: {
        status: 'requested',
      }, include: {
        passenger: true,
        driver: true,
      }
    });
    console.log("requestedTrips:", requestedTrips)

    const newTripsDto: TripDto[] = requestedTrips.map((trip) => ({
      id: trip.token, //o trip token é o idetificador publico do driver
      status: trip.status,
      distance: trip.distance,
      duration: trip.duration,
      freight: trip.freight,
      directions: trip.directions,
      passenger_name: trip.passenger.name,
      source: {
        name: trip.source.name,
        location: {
          lat: trip.source.location.lat,
          lng: trip.source.location.lng
        }
      },
      destination: {
        name: trip.destination.name,
        location: {
          lat: trip.destination.location.lat,
          lng: trip.destination.location.lng
        }
      }

    }))

    return newTripsDto
  }

  async confirmTrip(trip_token: string, driver_email:string): Promise<TripDto> {

    // let payload: jwt.JwtPayload = this.verifyPublicTripToken(trip_token);

    const trip = await this.prisma.trip.findUnique({
      where: { token: trip_token },
    });

    if (!trip) throw new NotFoundException('Viagem não encontrada.');

    console.log("email do driver: ", driver_email)

    const driver = await this.prisma.user.findUnique({
      where:{
        email: driver_email
      }
    }) 
    const updatedTrip = await this.prisma.trip.update({
      where: {
        id: trip.id,
      },
      data: {
        status: "accepted",          // exemplo: 'accepted'
        driver: {
          connect: {
            id: driver.id,       // o objeto trip.driver deve ter o id do driver
          },
        },
      },
      include: {
        driver: {
          include: {
            user: true, // Inclui os dados do usuário do driver
          },
        },
      },
    });

    const updatedTripDto: TripDto = {
      status: updatedTrip.status,
      distance: updatedTrip.distance,
      duration: updatedTrip.duration,
      freight: updatedTrip.freight,
      directions: updatedTrip.directions,
      driver_name: updatedTrip.driver.user.name,
      source: {
        name: updatedTrip.source.name,
        location: {
          lat: updatedTrip.source.location.lat,
          lng: updatedTrip.source.location.lng
        }
      },
      destination: {
        name: updatedTrip.destination.name,
        location: {
          lat: updatedTrip.destination.location.lat,
          lng: updatedTrip.destination.location.lng
        }
      }

    }
    console.log(updatedTripDto)
    return updatedTripDto;
  }

  async cancelTrip(trip_token: string, user_email: string, reason?: string, comment?: string) {

    const trip = await this.prisma.trip.findUnique({
      where: { token: trip_token },
      include: { passenger: true, driver: { include: { user: true } } }
    });

    if (!trip) throw new BadRequestException('Viagem não encontrada.');

    if (trip.status === 'cancelled') {
      throw new BadRequestException('Esta viagem já foi cancelada.');
    }
    let user = { id: '', role: '' as Role, };

    if (trip.passenger.email === user_email) {
      user.role = trip.passenger.role;
      user.id = trip.passenger.id;

    } else if (trip.driver?.user.email === user_email) {
      user.role = trip.driver.user.role;
      user.id = trip.driver.id;
    } else {
      throw new BadRequestException('Usuário não autorizado para cancelar esta viagem.');
    }

    await this.prisma.trip.update({
      where: { id: trip.id },
      data: { status: 'cancelled' }
    });

    await this.prisma.tripCancellation.create({
      data: {
        trip_id: trip.id,
        cancelledBy: user.role,
        user_id: user.id,
        reason,
        comment
      }
    });

    return {
      message: `Viagem cancelada com sucesso`,
      reason
    };
  }

  async getTripHistoric(id: string) {

    const trips = await this.prisma.trip.findMany({
      where: { id: id },
      include: {
        passenger: true,
        driver: true,
      }
    });
    return trips;
  }

  async generatePublicTripToken(tripToken: string) {
    return jwt.sign(
      {
        tripToken,
        type: 'trip-cancel'
      },
      process.env.TRIP_SECRET,
      { expiresIn: '3h' }
    );
  }

  async verifyPublicTripToken(trip_token: string) {
    let payload: jwt.JwtPayload;
    try {
      payload = jwt.verify(trip_token, process.env.TRIP_SECRET) as { tripToken: string, type: string };
    } catch {
      throw new UnauthorizedException('Token inválido ou expirado.');
    }

    if (payload.type !== 'trip-cancel') {
      throw new UnauthorizedException('Tipo de token inválido.');
    }
    return payload;
  }
}
