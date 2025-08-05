import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { hash, compare } from "bcryptjs";
import { PassengerDto } from './dto/passenger.dto';
import { JwtService } from "@nestjs/jwt";
import { createNewUserAcessToken, createNewUserRefreshToken } from '../utils';
import { NewTripService } from 'src/trips/new-trip/new-trip.service';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class PassengerService {
  constructor(private prismaService: PrismaService, private jwtService: JwtService, private newTripService: NewTripService) { }

  async createPassenger(passenger: any): Promise<PassengerDto> {

    if (!passenger.email || !passenger.password) {
      throw new Error("missing email or incorrect :(");
    }

    const emailAlreadyExist = await this.prismaService.user.findUnique({
      where: { email: passenger.email }
    });

    if (emailAlreadyExist) {
      throw new BadRequestException("Email already exists");
    }

    const hashedPassword = await hash(passenger.password, 10);

    const newPassenger = await this.prismaService.user.create({
      data: {
        name: passenger.name,
        email: passenger.email,
        password: hashedPassword,
        role: 'passenger',
        telephone: passenger.telephone,
        image: passenger.image,
      }
    });


    // Após criar o usuário com sucesso
    const payload = { userId: newPassenger.id, userRole: newPassenger.role };
    const access_token = createNewUserAcessToken(payload)

    const refresh_token = createNewUserRefreshToken(payload)

    const hashedUserRefreshToken = await hash(refresh_token, 10);

    await this.prismaService.userRefreshToken.create({
      data: {
        token: hashedUserRefreshToken, // Armazena o token hash por segurança
        user: {
          connect: { id: newPassenger.id }
        },
        isRevoked: false,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias
      },
    });
    return {
      session: {
        access_token,
        refresh_token,
      },
      user: {
        name: newPassenger.name,
        email: newPassenger.email,
        telephone: newPassenger.telephone,
        image: newPassenger.image
      }
    }
  };

}
