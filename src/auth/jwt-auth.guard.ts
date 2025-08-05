import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import * as jwt from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractToken(request);

    if (!token) { //acess token is not provided
      throw new UnauthorizedException('Token não fornecido');
    }

    try {
      const decoded = jwt.verify(
        token,
        this.configService.get<string>('JWT_SECRET'),
      );
      request['user'] = decoded;
      return true;
    } catch (error) {
      throw new UnauthorizedException('Token inválido ou expirado');
    }
  }

  private extractToken(request: Request): string | null {
    const authHeader = request.headers.authorization;
    if (!authHeader) return null;

    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' && token ? token : null;
  }
}
