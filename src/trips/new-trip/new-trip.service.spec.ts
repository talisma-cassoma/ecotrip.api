import { Test, TestingModule } from '@nestjs/testing';
import { NewTripService } from './new-trip.service';

describe('NewTripService', () => {
  let service: NewTripService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NewTripService],
    }).compile();

    service = module.get<NewTripService>(NewTripService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
