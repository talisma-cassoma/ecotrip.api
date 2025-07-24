import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { TripDto } from '../../trips/dto/trip.dto';

@Injectable()
export class PassengerService {
  constructor(private prisma: PrismaService) {}

  async verifyPassengerTrip(tripId: string, passengerId: string) {
    // Busca a viagem pelo ID
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
    });

    if (!trip) {
      throw new NotFoundException('Viagem não encontrada.');
    }

    if (trip.passengerId !== passengerId) {
      throw new ForbiddenException('Você não tem acesso a esta viagem.');
    }
    const tripDto = {
      id: trip.id,
      status: trip.status,
      name: trip.name ?? null,
      distance: trip.distance,
      duration: trip.duration,
      freight: trip.freight,
      directions: trip.directions,
      driver_id: trip.driver_id ?? null,
      passengerId: trip.passengerId,
      source: {
        name: trip.source.name,
        location: {
          lat: trip.source.location.lat,
          lng: trip.source.location.lng,
        },
      },
      destination: {
        name: trip.destination.name,
        location: {
          lat: trip.destination.location.lat,
          lng: trip.destination.location.lng,
        },
      },
    }
    return tripDto;
  }
}
