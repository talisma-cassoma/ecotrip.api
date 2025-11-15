export class TripDto {

    id?: string;
    status?: string;
    distance: number;
    duration: number;
    price: number;
    directions: any;
    driver_id?: string | null;
    driver_name?: string | null;
    passenger_id?: string;
    passenger_name?: string;
    origin: {
        name: String;
        location: {
            lat: number;
            lng: number;
        }
    };
    destination: {
        name: String;
        location: {
            lat: number;
            lng: number;
        }
    };
}