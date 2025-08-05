import {
    Body,
    Controller,
    Post,
    BadRequestException,
} from '@nestjs/common';

import { DriverService } from './driver.service';

@Controller('driver')
export class DriverController {
    constructor(private driverService: DriverService) { }
    @Post('create')
    async createDriver(@Body() driver: any) {;

        if (!driver?.email || !driver?.password) {
            throw new BadRequestException('ID do driver é obrigatório.');
        }
        
        const newDriver = await this.driverService.createDriver(driver);
        return { message: 'Driver sincronizado com sucesso', driver: newDriver };
    }
}
