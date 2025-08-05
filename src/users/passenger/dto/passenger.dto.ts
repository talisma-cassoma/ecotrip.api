export class PassengerDto {
    session?: {
        access_token?: string
        refresh_token?: string
    };
    user:{
        name: string
        email?: string
        image: string
        telephone: string
        status?: string;
    }
}