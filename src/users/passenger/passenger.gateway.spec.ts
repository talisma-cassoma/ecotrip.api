import { Test, TestingModule } from '@nestjs/testing';
import { PassengerGateway } from './passenger.gateway';

describe('PassengerGateway', () => {
  let gateway: PassengerGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PassengerGateway],
    }).compile();

    gateway = module.get<PassengerGateway>(PassengerGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
