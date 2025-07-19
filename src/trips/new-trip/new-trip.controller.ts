import {
  Body,
  Controller,
  Post,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
//import { SupabaseService } from 'src/auth/supabase.service'; // Supondo que você tem um serviço para verificar os tokens
import { NewTripService } from './new-trip.service';

export interface ITrip {
  id: string;
  origin: string;
  destination: string;
  duration: string;
  price?: number;
  distance: string;
}

@Controller('new-trip')
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
}

