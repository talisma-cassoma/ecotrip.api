import {
  Body,
  Controller,
  Post,
  Headers,
  UnauthorizedException,
  Param,
  Get,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
//import { SupabaseService } from 'src/auth/supabase.service'; // Supondo que você tem um serviço para verificar os tokens
import { NewTripService } from './new-trip.service';
import { TripDto } from '../dto/trip.dto';

export interface ITrip {
  id: string;
  origin: string;
  destination: string;
  duration: string;
  price?: number;
  distance: string;
}

@Controller('trips/new-trip')
export class NewTripController {
  constructor(
    private prisma: PrismaService,
    private tripService: NewTripService,
    //private supabase: SupabaseService,
  ) {}

  @Post()
  async createTrip(
    @Body() trip: ITrip,
    @Headers('access_token') accessToken: string,
    @Headers('refresh_token') refreshToken: string,
  ) {
    // Verifica se o token é válido e extrai o user_id
    // const user = await this.supabase.verifyToken(accessToken);

    // if (!user) {
    //   throw new UnauthorizedException('Token inválido');
    // }

    // Verifica se o usuário existe e se é passageiro
    // const found = await this.prisma.user.findUnique({
    //   where: { supabase_id: user.sub },
    // });

    // if (!found || found.role !== 'passenger') {
    //   throw new UnauthorizedException('Apenas passageiros podem criar viagens');
    // }

    // Cria a viagem com vínculo ao passageiro
    return this.tripService.createTrip(trip
        // { ...trip, passengerId: found.id }
    );
  }
  
 @Post('trips/:tripId/confirm')
  async confirmTrip(
    @Param('tripId') tripId: string,
    @Body() body: { driver_id: string },
    @Headers('access_token') accessToken: string,
    @Headers('refresh_token') refreshToken: string
  ) {
    return this.tripService.confirmTrip(tripId, body.driver_id);
  }

  @Post('trips/:tripId/cancel/passenger')
  async cancelTripByPassenger(
    @Param('tripId') tripId: string,
    @Body() body: { passenger_id: string; reason: string },
    @Headers('access_token') accessToken: string,
    @Headers('refresh_token') refreshToken: string
  ) {
    return this.tripService.cancelTripByPassenger(tripId, body.passenger_id, body.reason);
  }

  @Post('trips/:tripId/cancel/driver')
  async cancelTripByDriver(
    @Param('tripId') tripId: string,
    @Body() body: { driver_id: string; reason: string },
    @Headers('access_token') accessToken: string,
    @Headers('refresh_token') refreshToken: string
  ) {
    return this.tripService.cancelTripByDriver(tripId, body.driver_id, body.reason);
  }

  @Get('trips/historic')
  async getTripHistoric(
    @Body() body: { user_id: string },
    @Headers('access_token') accessToken: string,
    @Headers('refresh_token') refreshToken: string
  ) {
    return this.tripService.getTripHistoric(body.user_id);
  }}



