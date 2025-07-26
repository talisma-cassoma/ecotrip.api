import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { TripDto } from '../dto/trip.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class NewTripService {
  constructor(private prisma: PrismaService, private eventEmitter: EventEmitter2) { }

  async createTrip(data: any) {
    try {
      // Validação mínima (opcional)
      if (!data.origin || !data.destination || !data.passengerId || !data.price) {
        throw new BadRequestException('Campos obrigatórios ausentes.');
      }

      const createdTrip = await this.prisma.trip.create({
        data: {
          source: data.origin,
          destination: data.destination,
          distance: data.distance,
          duration: data.duration,
          freight: data.price,
          directions: data.directions ?? {}, // se não vier, salva vazio
          status: 'requested',
          passengerId: data.passengerId,
        },
      });

      // comunicate the event to driver gateway === o quivalente a usar um system de fila 
      this.eventEmitter.emit('trip.created');

      return {
        tripId: createdTrip.id,
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

  async getNewTrips() {
    const requestedTrips = await this.prisma.trip.findMany({
      where: {
        status: 'requested',
      }
    });

    const newTripsDto: TripDto[] = requestedTrips.map((trip) => ({
      id: trip.id,
      status: trip.status,
      name: trip.name,
      distance: trip.distance,
      duration: trip.duration,
      freight: trip.freight,
      directions: trip.directions,
      driver_id: trip.driver_id,
      passengerId: trip.passengerId,
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

  async confirmTrip(trip: any , driver_id: string) {
    const updatedTrip = await this.prisma.trip.update({
      where: {
        id: trip.id,
      },
      data: {
        status: "accepted",          // exemplo: 'accepted'
        driver: {
          connect: {
            id: trip.driver_id,       // o objeto trip.driver deve ter o id do driver
          },
        },
      },
    });

    return updatedTrip;
  }

  async cancelTripByPassenger(tripId: string, passengerId: string, reason?: string) {
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
    });

    if (!trip || trip.passengerId !== passengerId) {
      throw new BadRequestException('Viagem inválida ou não pertence ao passageiro.');
    }

    const updatedTrip = await this.prisma.trip.update({
      where: { id: tripId },
      data: { status: 'cancelled' },
    });

    return updatedTrip;
  }
async cancelTripByDriver(tripId: string, passengerId: string, reason?: string) {
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
    });

    if (!trip || trip.passengerId !== passengerId) {
      throw new BadRequestException('Viagem inválida ou não pertence ao passageiro.');
    }

    const updatedTrip = await this.prisma.trip.update({
      where: { id: tripId },
      data: { status: 'cancelled' },
    });

    return updatedTrip;
  }
async getTripHistoric(id: string) {

    const trips = await this.prisma.trip.findMany({
      where: { id: id }
    });
    return trips;
  }
}
