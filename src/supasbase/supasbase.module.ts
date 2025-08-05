import { Module } from '@nestjs/common';
import { SupabaseAuthService } from './supasbase.service';

@Module({
  providers: [SupabaseAuthService]
})
export class SupasbaseModule {}
