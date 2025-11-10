// room.ts
import Attendee from "./attendee";

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
  owner: Attendee;                 // passenger que criou a trip (owner)
  users?: Set<Attendee>;           // passenger + múltiplos drivers que entraram (ofertas)
  assignedDriver?: Attendee | null; // driver escolhido pelo passenger
  status?: TripStatus;
  origin: LocationPoint;
  destination: LocationPoint;
  price?: number;
  created_at?: Date;
  updated_at?: Date;
}

export default class Room {
  id: string;
  owner: Attendee;
  users: Set<Attendee>;
  assignedDriver?: Attendee | null;
  status: TripStatus;
  price?: number;
  origin: LocationPoint;
  destination: LocationPoint;
  created_at: Date;
  updated_at: Date;

  constructor({
    id = "",
    owner,
    users = new Set<Attendee>(),
    assignedDriver = null,
    status = "requested",
    price,
    origin, 
    destination,
    created_at = new Date(),
    updated_at = new Date(),
  }: Partial<RoomProps> & { owner: Attendee }) {
    this.id = id;
    this.owner = new Attendee({ ...owner }); // owner is the passenger who requested
    this.users = new Set(users);
    // ensure owner exists in users set
    this.users.add(this.owner);
    this.assignedDriver = assignedDriver ? new Attendee({ ...assignedDriver }) : null;
    this.status = status;
    this.origin = origin;
    this.price = price;
    this.destination = destination;
    this.created_at = created_at;
    this.updated_at = updated_at;
  }

  get attendeesCount(): number {
    return this.users.size;
  }

  addUser(user: Attendee) {
    user.roomId = this.id;
    this.users.add(new Attendee({ ...user }));
    this.updated_at = new Date();
  }

  removeUser(userId: string) {
    for (const u of [...this.users]) {
      if (u.id === userId) {
        u.roomId = "";
        this.users.delete(u);
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
    const chosen = [...this.users].find((u) => u.id === driverId && u.isDriver());
    if (!chosen) {
      throw new Error("Driver not found in this room");
    }

    this.assignedDriver = new Attendee({ ...chosen });
    this.status = "accepted";
    this.updated_at = new Date();

    // remove other drivers (keep owner and chosen driver)
    for (const u of [...this.users]) {
      if (u.isDriver() && u.id !== driverId) {
        this.users.delete(u);
        u.roomId = "";
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
      origin: this.origin,
      destination: this.destination,
      attendeesCount: this.attendeesCount,
      users: [...this.users].map((u) => u.toJSON()),
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  }
}
