import {
    Body,
    Controller,
    Post,
    BadRequestException,
} from '@nestjs/common';
import { PassengerService } from './passenger.service';
//import {hash} from "bcryptjs";

@Controller('passenger')
export class PassengerController {
      constructor(private passengerService: PassengerService) { }
        @Post('create')
        async createPassenger(@Body() passenger: any) {;
    
            if (!passenger?.email || !passenger?.password) {
                throw new BadRequestException('ID do passenger é obrigatório.');
            }
            
            const newPassenger = await this.passengerService.createPassenger(passenger);
            return { message: 'passenger sincronizado com sucesso', passenger: newPassenger };
        }

}
