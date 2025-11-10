import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Driver } from '@prisma/client';
import { TripDto } from 'src/trips/dto/trip.dto';
import { DriverDto } from './dto/driver.dto';
import { hash } from "bcryptjs";
import { JwtService } from "@nestjs/jwt";
import { createNewUserAcessToken, createNewUserRefreshToken } from '../utils';

@Injectable()
export class DriverService {
  constructor(
    private prismaService: PrismaService,
    private jwtService: JwtService
  ) { }

  async findAvailableDrivers(): Promise<Driver[]> {
    return await this.prismaService.driver.findMany({
      where: {
        status: 'available',
      },
    });
  }

  async shareRequestedTripsToDrivers() {
    const requestedTrips = await this.prismaService.trip.findMany({
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
      passenger_id: trip.passenger_id,
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

  }

  async createDriver(driver: any): Promise<DriverDto> {

    if (!driver.email || !driver.password) {
      throw new BadRequestException("missing email or incorrect :(");
    }

    const emailAlreadyExist = await this.prismaService.user.findUnique({
      where: { email: driver.email }
    });

    if (emailAlreadyExist) {
      throw new BadRequestException("email already exists :(");
    }

    const hashedPassword = await hash(driver.password, 10);

    const newDriver = await this.prismaService.user.create({
      data: {
        name: driver.name,
        email: driver.email,
        password: hashedPassword,
        role: 'driver',
        telephone: driver.telephone,
        image: driver.image,
        driver: {
          create: {
            car_model: driver.carModel,
            car_plate: driver.carPlate,
            car_color: driver.carColor,
            license_number: driver.licenseNumber,
            rating: driver.rating ?? 0,
            completed_rides: driver.complitedRides ?? 0,
            status: 'available',
          }
        }
      },
      include: {
        driver: true,
      }
    });
    // Após criar o usuário com sucesso
    const payload = { userId: newDriver.id, userRole: newDriver.role };
    const access_token = createNewUserAcessToken(payload)

    const refresh_token = createNewUserRefreshToken(payload)

    const hashedUserRefreshToken = await hash(refresh_token, 10);

    await this.prismaService.userRefreshToken.create({
      data: {
        token: hashedUserRefreshToken, // Armazena o token hash por segurança
        user: {
          connect: { id: newDriver.id }
        },
        isRevoked: false,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias
      },
    });
    const user = {
      session: {
        access_token,
        refresh_token,
      },
      user: {
        name: newDriver.name,
        email: newDriver.email,
        telephone: newDriver.telephone,
        image: newDriver.image,
        role: newDriver.role,
        carModel: newDriver.driver.car_model,
        carPlate: newDriver.driver.car_plate,
        carColor: newDriver.driver.car_color,
        rating: newDriver.driver.rating,
        complited_rides: newDriver.driver.completed_rides,
      }
    }
    console.log(user)
    return user
  };

}
