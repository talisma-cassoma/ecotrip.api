export class DriverDto {
    session?: {
        access_token?: string
        refresh_token?: string
    };
    user:{
        name: string
        email?: string
        image: string
        telephone?: string
        role?: string
        carModel?: string
        carPlate?: string
        carColor?: string
        licenseNumber?: string
        rating?: number
        complited_rides?: number
        status?: string;
    }
}