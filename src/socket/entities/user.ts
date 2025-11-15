// User.ts
export type PassengerRole = {
  type: "passenger";
};

export type DriverRole = {
  type: "driver";
  data?: {
    car_model?: string;
    car_plate?: string;
    car_color?: string;
    license_number?: string;
    rating?: number;
    completed_rides?: number;
  };
};

export type UserRole = PassengerRole | DriverRole;

export interface UserProps {
  id?: string;
  soketId?: string;
  username?: string;
  email?: string;
  image?: string;
  telephone?: string;
  role?: UserRole;
  peerId?: string;        // p2p future
  roomId?: string;        // current room id (empty if none)
  access_token?: string;  // optional, if you handle auth here
  refresh_token?: string;
}

export default class User {
  id: string;
  soketId? : string;
  username: string;
  email?: string;
  image?: string;
  telephone?: string;
  role: UserRole;
  peerId?: string;
  access_token?: string;
  refresh_token?: string;

  constructor({
    id = "",
    username = "",
    soketId,
    email,
    image,
    telephone,
    role = { type: "passenger" } as PassengerRole,
    peerId = "",
    access_token,
    refresh_token,
  }: UserProps = {}) {
    this.id = id;
    this.soketId = soketId;
    this.username = username ?? "";
    this.email = email;
    this.image = image;
    this.telephone = telephone;
    this.role = role;
    this.peerId = peerId;
    this.access_token = access_token;
    this.refresh_token = refresh_token;
  }

  isDriver(): boolean {
    return this.role?.type === "driver";
  }

  isPassenger(): boolean {
    return this.role?.type === "passenger";
  }

  // basic serializer to avoid circular references when emitting
  toJSON() {
    return {
      id: this.id,
      username: this.username,
      email: this.email,
      image: this.image,
      telephone: this.telephone,
      role: this.role,
      peerId: this.peerId,
    };
  }
}
