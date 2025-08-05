import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('users')
export class UsersController {

    constructor(private userService: UsersService) { }
    @Post('login')
    async signInUser(
        @Body() body: { email: string, password: string },
    ) {
        const data = await this.userService.signInUser(body.email, body.password);
        console.log("email: ",body.email," palavra passe :", body.password)
        console.log("usuario: ", data)
        return data
    }

@Post('logout')
@UseGuards(JwtAuthGuard)
    async signOutUser(
        @Body() body: { email: string },
    ) {
        await this.userService.signOutUser(body.email);    
    }

}
