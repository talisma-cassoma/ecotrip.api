import { Test, TestingModule } from '@nestjs/testing';
import { SupabaseAuthService } from './supasbase.service';

describe('SupasbaseService', () => {
  let service:  SupabaseAuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ SupabaseAuthService],
    }).compile();

    service = module.get<SupabaseAuthService>(SupabaseAuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
