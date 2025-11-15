// room.ts
import User from "./user";

export type LocationPoint = {
  name: string;
  location: {
    lat: number;
    lng: number;
  };
};

export type TripStatus = "requested" | "offered" | "accepted" | "in_progress" | "completed" | "cancelled";


export interface RoomProps {
  id?: string;
  owner: User;                 // passenger que criou a trip (owner)
  interestedDrivers?: Set<User>;           // passenger + múltiplos drivers que entraram (ofertas)
  assignedDriver?: User | null; // driver escolhido pelo passenger
  status?: TripStatus;
  distance?: number;
  duration?: number;
  origin?: LocationPoint;
  destination?: LocationPoint;
  price?: number;
  created_at?: Date;
  updated_at?: Date;
}

export default class Room {
  id: string;
  owner: User;
  interestedDrivers: Set<User>;
  assignedDriver?: User | null;
  status: TripStatus;
  price: number;
  distance: number;
  duration: number;
  origin: LocationPoint;
  destination: LocationPoint;
  created_at: Date;
  updated_at: Date;

  constructor({
    id = "",
    owner,
    interestedDrivers = new Set<User>(),
    assignedDriver = null,
    status = "requested",
    price,
    distance,
    duration,
    origin,
    destination,
    created_at = new Date(),
    updated_at = new Date(),
  }: Partial<RoomProps> & { owner: User }) {
    this.id = id;
    this.owner = new User({ ...owner }); // owner is the passenger who requested
    this.interestedDrivers = new Set(interestedDrivers);
    this.assignedDriver = assignedDriver ? new User({ ...assignedDriver }) : null;
    this.status = status;
    this.origin = origin;
    this.price = price;
    this.distance = distance;
    this.duration = duration;
    this.destination = destination;
    this.created_at = created_at;
    this.updated_at = updated_at;
  }

  get UsersCount(): number {
    return this.interestedDrivers.size;
  }

  addUser(user: User) {
    if(user.isPassenger() && user.id !== this.owner.id ){
      throw new Error("Only one passenger allowed per room");
    }
    this.interestedDrivers.add(new User({ ...user }));
    this.updated_at = new Date();
  }

  removeDriver(userId: string) {
    for (const u of [...this.interestedDrivers]) {
      if (u.id === userId) {
        this.interestedDrivers.delete(u);
        // if removed user was assigned driver, unassign
        if (this.assignedDriver && this.assignedDriver.id === userId) {
          this.assignedDriver = null;
          this.status = "requested";
        }
        this.updated_at = new Date();
        return u;
      }
    }
    return null;
  }

  // passenger selects a driver -> assign and remove other drivers
  assignDriver(driverId: string) {
    const chosen = [...this.interestedDrivers].find((u) => u.id === driverId && u.isDriver());
    if (!chosen) {
      throw new Error("Driver not found in this room");
    }

    this.assignedDriver = new User({ ...chosen });
    this.status = "accepted";
    this.updated_at = new Date();

    // remove other drivers (keep owner and chosen driver)
    for (const u of [...this.interestedDrivers]) {
      if (u.isDriver() && u.id !== driverId) {
        this.interestedDrivers.delete(u);
      }
    }
  }

  // revert assigned driver (e.g., driver left)
  unassignDriver() {
    if (this.assignedDriver) {
      // keep assignedDriver.roomId cleared by external flow if needed
      this.assignedDriver = null;
      this.status = "requested";
      this.updated_at = new Date();
    }
  }

  // mark trip lifecycle methods
  startTrip() {
    if (this.status !== "accepted") throw new Error("Trip must be accepted to start");
    this.status = "in_progress";
    this.updated_at = new Date();
  }

  completeTrip() {
    if (this.status !== "in_progress") throw new Error("Trip must be in progress to complete");
    this.status = "completed";
    this.updated_at = new Date();
  }

  cancelTrip() {
    this.status = "cancelled";
    this.updated_at = new Date();
  }

  // serialize safe object for socket emission
  toJSON() {
    return {
      id: this.id,
      owner: this.owner.toJSON(),
      assignedDriver: this.assignedDriver ? this.assignedDriver.toJSON() : null,
      status: this.status,
      price: this.price,
      distance: this.distance,
      duration: this.duration,
      origin: this.origin,
      destination: this.destination,
      UsersCount: this.UsersCount,
      interestedDrivers: [...this.interestedDrivers].map((u) => u.toJSON()),
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  }
}
