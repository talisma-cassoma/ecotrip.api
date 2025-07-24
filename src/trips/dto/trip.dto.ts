export class TripDto {

    id: string;
    status: string;
    name: string | null;
    distance: number;
    duration: number;
    freight: number;
    directions: any;
    driver_id: string | null;
    passengerId: string;
    source: {
        name: String
        location: {
            lat: number
            lng: number
        }
    };
    destination: {
        name: String
        location: {
            lat: number
            lng: number
        }
    };
}