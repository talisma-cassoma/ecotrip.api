import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { TripDto } from '../dto/trip.dto';

@Injectable()
export class NewTripService {
  constructor(private prisma: PrismaService) {}

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

  async getNewTrips(){
      const requestedTrips = await this.prisma.trip.findMany({
      where: {
        status: 'requested',
      }
    });
    return requestedTrips
  }

 async confirmTrip(trip: TripDto) {
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
}
