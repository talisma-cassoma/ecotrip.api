import { Module } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RefreshController } from './refresh/refresh.controller';
import { JwtService } from '@nestjs/jwt';

@Module({
  providers: [JwtAuthGuard, JwtService],
  exports: [JwtAuthGuard],
  controllers: [RefreshController],
})
export class AuthModule {}
