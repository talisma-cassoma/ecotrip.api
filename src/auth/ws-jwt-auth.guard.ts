import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class WsJwtGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const client = context.switchToWs().getClient();
    const token = client.handshake.auth?.token?.replace('Bearer ', '');

    if (!token) throw new UnauthorizedException('Token não fornecido');

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      context.switchToWs().getData().user = decoded; // opcional: guardar o user no contexto
      client.user = decoded; // opcional: anexar ao socket
      return true;
    } catch (err) {
      throw new UnauthorizedException('Token inválido');
    }
  }
}
