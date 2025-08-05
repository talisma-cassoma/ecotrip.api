import {
  BadRequestException,
  Controller,
  Post,
  Body,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { compare} from 'bcryptjs';
import { createNewUserAcessToken } from 'src/users/utils';

@Controller('auth')
export class RefreshController {
  constructor(
    private prismaService: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  @Post('refresh')
  async refreshToken(@Body() body: { refresh_token: string }) {
    const refreshToken = body.refresh_token;

    if (!refreshToken) {
      throw new BadRequestException('Refresh token não fornecido');
    }

    // Verifica assinatura do JWT
    let payload: any;
    try {
      payload = jwt.verify(
        refreshToken,
        this.config.get<string>('JWT_REFRESH_SECRET'),
      );
    } catch (err) {
     throw new UnauthorizedException('Token inválido ou expirado');

    }

    // Busca o token no banco (hash comparado)
    const storedTokens = await this.prismaService.userRefreshToken.findMany({
      where: {
        user_id: payload.sub,
        isRevoked: false,
      },
    });

    const matched = await Promise.any(
      storedTokens.map((t) => compare(refreshToken, t.token)),
    ).catch(() => null);

    if (!matched) {
      throw new ForbiddenException('Você não tem permissão para acessar este recurso');
    }

    // Gera novo access token
    const newAccessToken = createNewUserAcessToken({userId:payload.sub, userRole:payload.role})

    return { access_token: newAccessToken };
  }
}
