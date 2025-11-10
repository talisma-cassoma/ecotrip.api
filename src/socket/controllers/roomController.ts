import { Socket } from 'socket.io';
import { EventEmitter } from 'events';
import Attendee from '../entities/attendee';
import Room from '../entities/room';
import { constants } from '../constants';
import CustomMap, { CustomMapObserver } from '../customMap';

interface RoomsControllerOptions {
  roomsPubSub: EventEmitter;
}

/**
 * Gerencia as rooms (viagens) entre passageiros e motoristas.
 * Notifica o LobbyController através de roomsPubSub.
 */
export default class RoomsController {
  /** Cache global de usuários conectados */
  #users: Map<string, Attendee> = new Map();

  /** Rooms em memória com observador para mudanças */
  rooms: CustomMap<string, Room, ReturnType<Room['toJSON']>>;

  /** Canal de eventos interno usado para sincronização com o LobbyController */
  roomsPubSub: EventEmitter;

  constructor({ roomsPubSub }: RoomsControllerOptions) {
    this.roomsPubSub = roomsPubSub;

    this.rooms = new CustomMap<string, Room, ReturnType<Room['toJSON']>>({
      observer: this.#roomObserver(),
      customMapper: this.#mapRoom.bind(this),
    });
  }

  /** Observador que notifica o LobbyController */
  #roomObserver(): CustomMapObserver<string, Room, ReturnType<Room['toJSON']>> {
    return {
      notify: (rooms: CustomMap<string, Room, ReturnType<Room['toJSON']>>) => {
        const serializedRooms = [...rooms.mappedValues()];
        this.roomsPubSub.emit(constants.event.LOBBY_UPDATED, serializedRooms);
      },
    };
  }

  /** Função que serializa a Room */
  #mapRoom(room: Room): ReturnType<Room['toJSON']> {
    return room.toJSON();
  }

  /** 🔹 Nova conexão de socket */
  onNewConnection(socket: Socket): void {
    console.log('[RoomsController] connection established with', socket.id);
    this.#updateGlobalUserData(socket.id);
  }

  /** 🔹 Desconexão de socket */
  disconnect(socket: Socket): void {
    console.log('[RoomsController] disconnect!!', socket.id);
    this.#handleDisconnect(socket);
  }

  /** 🔹 Usuário entra em uma room */
  joinRoom(
    socket: Socket,
    { user, room }: { user: Partial<Attendee>; room: Partial<Room> }
  ): void {
    const userId = (user.id = socket.id);
    const roomId = room.id ?? '';

    const updatedUser = this.#updateGlobalUserData(userId, user, roomId);
    const updatedRoom = this.#joinUserRoom(socket, updatedUser, room);

    console.log(
      `[RoomsController] User ${userId} joined room ${JSON.stringify(updatedRoom.toJSON())}`
    );

    // A notificação para o LobbyController acontece via observer → roomsPubSub
    this.#replyWithActiveUsers(socket, updatedRoom.users);
  }

  // ======================================================
  // MÉTODOS PRIVADOS
  // ======================================================

  /** Lida com desconexão e limpeza */
  #handleDisconnect(socket: Socket): void {
    const userId = socket.id;
    const user = this.#users.get(userId);
    if (!user) return;

    const roomId = user.roomId;
    const room = this.rooms.get(roomId);
    this.#users.delete(userId);

    if (!room) return;

    console.log(`[RoomsController] User ${userId} disconnected from room ${roomId}`);
    room.removeUser(userId);

    if (room.owner.id === userId) {
      // Passenger saiu → encerra a room
      this.rooms.delete(roomId);
      console.log(`[RoomsController] Room ${roomId} closed (passenger disconnected)`);
    } else {
      // Driver saiu → apenas atualiza room (o observer notificará automaticamente)
      this.rooms.set(roomId, room);
    }
  }

  /** Cria ou atualiza uma sala existente */
  #joinUserRoom(socket: Socket, user: Attendee, room: Partial<Room>): Room {
    const roomId = room.id ?? '';
    const existingRoom = this.rooms.get(roomId);

    console.log("existingRoom:", existingRoom?.origin);
    console.log("room.origin:", room.origin);
    console.log("room.destination:", room.destination);

    const owner: Attendee = existingRoom ? existingRoom.owner : user;
    const users: Set<Attendee> = existingRoom ? new Set(existingRoom.users) : new Set();

    users.add(user);

    const updatedRoom = new Room({
      id: roomId,
      owner,
      users,
      origin: room.origin ?? existingRoom?.origin,
      destination: room.destination ?? existingRoom?.destination,
      status: room.status ?? existingRoom?.status ?? "requested",
      assignedDriver: room.assignedDriver ?? existingRoom?.assignedDriver ?? null,
      price: room.price ?? existingRoom?.price,
      created_at: existingRoom?.created_at ?? new Date(),
      updated_at: new Date(),
    });


    this.rooms.set(roomId, updatedRoom);
    socket.join(roomId);

    return updatedRoom;
  }

  /** Atualiza o cache global de usuários */
  #updateGlobalUserData(userId: string, userData: Partial<Attendee> = {}, roomId = ''): Attendee {
    const existing = this.#users.get(userId) ?? {};
    const updated = new Attendee({
      ...existing,
      ...userData,
      roomId,
    });
    this.#users.set(userId, updated);
    return updated;
  }

  /** Envia lista de usuários ativos da room para o socket atual */
  #replyWithActiveUsers(socket: Socket, users: Set<Attendee>): void {
    socket.emit(constants.event.LOBBY_UPDATED, [...users].map((u) => u.toJSON()));
  }

  /** Retorna apenas métodos públicos (para integração com socketServer) */
  getEvents(): Map<string | symbol, (...args: any[]) => void> {
    const proto = Object.getPrototypeOf(this);
    const protoKeys = Reflect.ownKeys(proto).filter((key) => {
      if (key === 'constructor' || key === 'getEvents') return false;
      const name = String(key);
      return !name.startsWith('_') && typeof (this as any)[key] === 'function';
    });

    const entries = protoKeys.map((key) => {
      const fn = (this as any)[key];
      return [key, fn.bind(this)] as [string | symbol, (...args: any[]) => void];
    });

    return new Map(entries);
  }
}
