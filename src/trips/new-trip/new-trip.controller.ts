import {
  Body,
  Controller,
  Post,
  Param,
  Get,
  UseGuards,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { NewTripService } from './new-trip.service';
import { AuthenticatedRequest } from 'src/auth/types';


@Controller('trips')
export class NewTripController {
  constructor(
    private tripService: NewTripService,
  ) { }

  @Post('/new-trip')
  @UseGuards(JwtAuthGuard)
  async createTrip(
    @Body() trip: any,
  ) {
    // Cria a viagem com vínculo ao passageiro
    return this.tripService.createTrip(trip);
  }

  @Post(':tripId/confirm')
  @UseGuards(JwtAuthGuard)
  async confirmTrip(
    @Param('tripId') tripId: string,
    @Body() body: { driver_email: string },
  ) {
    return this.tripService.confirmTrip(tripId, body.driver_email);
  }

  @Post(':tripId/cancel/passenger')
  @UseGuards(JwtAuthGuard)
  async cancelTripByPassenger(
    @Req() req: AuthenticatedRequest,
    @Body() body: { trip_token: string; reason: string },
  ) {
    return this.tripService.cancelTrip(body.trip_token, req.user.email, body.reason);
  }

  @Post(':tripId/cancel/driver')
  @UseGuards(JwtAuthGuard)
  async cancelTripByDriver(
    @Req() req: AuthenticatedRequest,
    @Body() body: { trip_token: string; reason: string },
  ) {
    return this.tripService.cancelTrip(body.trip_token, req.user.email, body.reason);
  }
  @UseGuards(JwtAuthGuard)
  @Get('historic')
  async getTripHistoric(
    @Req() req: AuthenticatedRequest, // Requisição do usuário autenticado
  ) {
    return this.tripService.getTripHistoric(req.user.email);
  }
  @UseGuards(JwtAuthGuard)
  @Get('available')
  async findAvailableTrips(
    @Req() req: AuthenticatedRequest,
  ) {

    return this.tripService.getNewTrips();
  }
}



