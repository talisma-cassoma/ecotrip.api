import {
    Body,
    Controller,
    Post,
    Headers,
    UnauthorizedException,
    BadRequestException,
} from '@nestjs/common';
import { DriverService } from './driver.service';

@Controller('driver')
export class DriverController {
    constructor(private driverService: DriverService) { }
    @Post('sync-driver')
    async syncDriver(@Body() driver: any) {
        if (!driver?.id) {
            throw new BadRequestException('ID do driver é obrigatório.');
        }
        await this.driverService.syncDriver(driver);
        return { message: 'Driver sincronizado com sucesso' };
    }

}
