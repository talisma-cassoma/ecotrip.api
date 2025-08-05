import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
import { PrismaService } from 'src/prisma/prisma.service';
import { createNewUserAcessToken, createNewUserRefreshToken } from './utils';
import { ForbiddenException, BadRequestException } from '@nestjs/common';

@Injectable()
export class UsersService {
    constructor(private prismaService: PrismaService, private jwtService: JwtService) { }
    async signInUser(email: string, password: string) {
        const user = await this.prismaService.user.findUnique({
            where: { email },
            include: { driver: true },
        })
        console.log("user", user)

        if (!user) throw new BadRequestException("User not found");

        const isPasswordValid = await compare(password, user.password);
        if (!isPasswordValid) throw new ForbiddenException("Invalid credentials");

        if (user.driver) {
            await this.prismaService.driver.update({
                where: { id: user.id },
                data: { status: "available" },
            });
        }

        const payload = { userId: user.id, userRole: user.role };
        const access_token = createNewUserAcessToken(payload)

        const refresh_token = createNewUserRefreshToken(payload)

        const hashedUserRefreshToken = await hash(refresh_token, 10);

        //create a new token if it doesn't exist or update the existing one
        await this.prismaService.userRefreshToken.update({
            where: { user_id: user.id },
            data: {
                token: hashedUserRefreshToken,
                isRevoked: false,
                expiresAt: new Date(Date.now() + 24 * 24 * 60 * 60 * 1000),
            }
        });

        let signedUser = () => {
            if (user.role == 'driver') {
                const driver = {
                    session: {
                        access_token,
                        refresh_token,
                    },
                    user: {
                        name: user.name,
                        email: user.email,
                        telephone: user.telephone,
                        image: user.image,
                        role: user.role,
                        carModel: user.driver.car_model,
                        carPlate: user.driver.car_plate,
                        carColor: user.driver.car_color,
                        rating: user.driver.rating,
                        complited_rides: user.driver.completed_rides,
                    }
                };
                return driver;
            }
            return {
                session: {
                    access_token,
                    refresh_token,
                },
                user: {
                    name: user.name,
                    email: user.email,
                    telephone: user.telephone,
                    image: user.image,
                    role: user.role
                }
            };
        }
        return signedUser()
    }
    
    async signOutUser(user_email: string) {
    console.log(user_email)
        // Delete or invalidate refresh token from DB
    const user = await this.prismaService.user.findUnique({
        where:{email: user_email},
        include:{
            driver:true
        }
    })
    
    if(!user){
        throw new ForbiddenException("user doesent exist")
    }
    await this.prismaService.userRefreshToken.update({
      where: { user_id: user.id, isRevoked: false },
      data: { isRevoked: true },
    });

    return { message: 'Logout successful' };
  }
}
