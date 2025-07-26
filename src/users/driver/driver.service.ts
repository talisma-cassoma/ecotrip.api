import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Driver } from '@prisma/client';
import { DriverGateway } from './driver.gateway';
import { TripDto } from 'src/trips/dto/trip.dto';

@Injectable()
export class DriverService {
  constructor(
    private prisma: PrismaService,
    private driverGateway: DriverGateway,
  ) {}

  async findAvailableDrivers(): Promise<Driver[]> {
    return await this.prisma.driver.findMany({
      where: {
        status: 'available',
      },
    });
  }

  async shareRequestedTrips() {
    const requestedTrips = await this.prisma.trip.findMany({
      where: {
        status: 'requested',
      }
    });

    const requestedTripsDto: TripDto[] = requestedTrips.map((trip) => ({
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
    }));

    // Emite para todos os clientes conectados
    this.driverGateway.server.emit('server:requested-trips', {
      requestedTripList: requestedTripsDto,
    });
  }
  async syncDriver(driver: any) {
     
    await this.prisma.driver.upsert({
            where: { id: driver.id },
            update: {
                name: driver.name,
                image: driver.image,
                telephone: driver.telephone,
                carModel: driver.carModel,
                carPlate: driver.carPlate,
                carColor: driver.carColor,
                rating: driver.rating ?? 0,
                complited_rides: driver.complited_rides ?? 0,
                status: driver.status ?? 'available',
            },
            create: {
                id: driver.id,
                name: driver.name,
                image: driver.image,
                telephone: driver.telephone,
                carModel: driver.carModel,
                carPlate: driver.carPlate,
                carColor: driver.carColor,
                rating: driver.rating ?? 0,
                complited_rides: driver.complited_rides ?? 0,
                status: driver.status ?? 'available',
            },
        });
  }
}
