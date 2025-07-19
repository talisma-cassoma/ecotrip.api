import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class NewTripService {
  constructor(private prisma: PrismaService) {}

  async createTrip(data: any) {
    await this.prisma.trip.create({
      data: {
        source: data.origin,
        destination: data.destination,
        distance: data.distance,
        duration: data.duration,
        freight: data.price,
        directions: data.directions,
        status: 'requested', 
        passengerId: data.passengerId,
      },
    });
    return ([
    {
        id: "1",
        name: "brian Johnson",
        description: "Experienced driver with a clean record.",
        image: "https://picsum.photos/id/237/200/300",
        telephone: "+1234567890",
        carModel: "Toyota Corolla",
        carPlate: "ABC-1234",
        carColor: "Blue",
    }, {
        id: "2",
        name: "John Doe",
        description: "Friendly and reliable driver.",
        image: "https://picsum.photos/id/237/200/300",
        telephone: "+0987654321",
        carModel: "Honda Civic",
        carPlate: "XYZ-5678",
        carColor: "Red",
    },
    {
        id: "3",
        name: "david oliver",
        description: "Friendly and reliable driver.",
        image: "https://picsum.photos/id/237/200/300",
        telephone: "+0987654321",
        carModel: "Ford Focus",
        carPlate: "LMN-9012",
        carColor: "Black",
    }, {
        id: "4",
        name: "Paul Walker",
        description: "Friendly and reliable driver.",
        image: "https://picsum.photos/id/237/200/300",
        telephone: "+0987654321",
        carModel: "Chevrolet Malibu",
        carPlate: "QRS-3456",
        carColor: "White",
    }, {
        id: "5",
        name: "mary jane watson",
        description: "Friendly and reliable driver.",
        image: "https://picsum.photos/id/237/200/300",
        telephone: "+0987654321",
        carModel: "Nissan Altima",
        carPlate: "TUV-7890",
        carColor: "Gray",
    }, {
        id: "6",
        name: "peter parker",
        description: "Friendly and reliable driver.",
        image: "https://picsum.photos/id/237/200/300",
        telephone: "+0987654321",
        carModel: "Hyundai Elantra",
        carPlate: "WXY-1234",
        carColor: "Silver",
    }
])
  }
}
