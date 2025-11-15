import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import { nanoid } from 'nanoid';

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Criar passageiros
  for (let i = 0; i < 5; i++) {
    await prisma.user.create({
      data: {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: faker.internet.password(),
        role: 'passenger',
        public_id: nanoid(12),
      }
    });
  }

  // Criar motoristas com dados extras
  for (let i = 0; i < 5; i++) {
    const user = await prisma.user.create({
      data: {
        name: faker.person.fullName(),
        public_id: nanoid(12),
        email: faker.internet.email(),
        password: faker.internet.password(),
        role: 'driver',
        telephone: faker.phone.number(),
        driver: {
          create: {
            car_model: faker.vehicle.model(),
            car_plate: faker.vehicle.vrm(),
            car_color: faker.color.human(),
            license_number: faker.string.alphanumeric(10),
            rating: faker.number.int({ min: 3, max: 5 }),
            completed_rides: faker.number.int({ min: 0, max: 100 }),
            status: faker.helpers.arrayElement(['available', 'on_trip', 'offline'])
          }
        }
      }
    });
  }

  // Criar trips fake
  const passengers = await prisma.user.findMany({ where: { role: 'passenger' } });
  const drivers = await prisma.driver.findMany();

  for (let i = 0; i < 5; i++) {
    const passenger = faker.helpers.arrayElement(passengers);
    const driver = faker.helpers.arrayElement(drivers);

    await prisma.trip.create({
      data: {
        name: `Viagem ${i + 1}`,
        public_id: nanoid(12),
        origin: {
          name: faker.location.city(),
          location: {
            lat: faker.location.latitude(),
            lng: faker.location.longitude()
          }
        },
        destination: {
          name: faker.location.city(),
          location: {
            lat: faker.location.latitude(),
            lng: faker.location.longitude()
          }
        },
        distance: faker.number.float({ min: 3, max: 30 }),
        duration: faker.number.float({ min: 5, max: 60 }),
        price: faker.number.float({ min: 150, max: 800 }),
        directions: {},
        status: faker.helpers.arrayElement(['requested', 'completed', 'in_progress']),
        passenger_id: passenger.id,
        driver_id: driver.id,
        interested_driver_ids: [driver.id] // simula interesse
      }
    });
  }

  console.log("✅ Seed finalizado!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
