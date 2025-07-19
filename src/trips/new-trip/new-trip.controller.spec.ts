import { Test, TestingModule } from '@nestjs/testing';
import { NewTripController } from './new-trip.controller';

describe('NewTripController', () => {
  let controller: NewTripController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NewTripController],
    }).compile();

    controller = module.get<NewTripController>(NewTripController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
