import { JwtService } from '@nestjs/jwt';

const jwtService = new JwtService();
export function createNewUserAcessToken(payload:{userId:string, userRole: string}){
        const access_token = jwtService.sign(payload, {
            secret: process.env.JWT_SECRET,
            expiresIn: '1d',
        });

        return access_token
}

export function createNewUserRefreshToken(payload:{userId:string, userRole: string}){

        const refresh_token = jwtService.sign(payload, {
            secret: process.env.JWT_REFRESH_SECRET,
            expiresIn: '7d',
        });

        return refresh_token
}