import { Test, TestingModule } from '@nestjs/testing';
import { DriverGateway } from './driver.gateway';

describe('DriverGateway', () => {
  let gateway: DriverGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DriverGateway],
    }).compile();

    gateway = module.get<DriverGateway>(DriverGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
