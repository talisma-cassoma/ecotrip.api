import { Socket } from 'socket.io';
import { EventEmitter2 } from '@nestjs/event-emitter'; 
import User, { UserRole } from '../entities/user';
import Room from '../entities/room';
import { constants } from '../constants';
import CustomMap, { CustomMapObserver } from '../customMap';
import { PrismaClient } from '@prisma/client';

interface RoomsControllerOptions {
  roomsPubSub: EventEmitter2;
}

/**
 * Gerencia as rooms (viagens) entre passageiros e motoristas.
 * Notifica o LobbyController através de roomsPubSub.
 */
export default class RoomsController {

  /** Cache global de usuários conectados */
  #users: Map<string, User> = new Map();

  /** Rooms em memória com observador para mudanças */
  rooms: CustomMap<string, Room, ReturnType<Room['toJSON']>>;

  /** Canal de eventos interno usado para sincronização com o LobbyController */
  roomsPubSub: EventEmitter2;

  constructor({ roomsPubSub }: RoomsControllerOptions) {
    this.roomsPubSub = roomsPubSub;

    this.rooms = new CustomMap<string, Room, ReturnType<Room['toJSON']>>({
      observer: this.#roomObserver(),
      customMapper: this.#mapRoom.bind(this),
    });

    // 👇 LISTEN TO TRIP.CREATED
    this.roomsPubSub.on(constants.event.TRIP_CREATED, this.#createRoomFromTrip.bind(this));
    console.log('[RoomsController] initialized.', );
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
  async #createRoomFromTrip(data: Room): Promise<void> {
    console.log('[RoomsController] Creating room from new trip:', data.id);

    const existing = this.rooms.get(data.id);
    if (existing) {
      console.log('[RoomsController] Room already exists, skipping...');
      return;
    }
 
    const updatedUser = this.#updateGlobalUserData(data.owner.id, data.owner, data.id);
    this.#joinUserRoom(updatedUser, data);
  }

  /** 🔹 Usuário entra em uma room */
  async joinRoom(
    socket: Socket,
    { user, room }: { user: Partial<User>; room: Partial<Room> }
  ): Promise<void> {

    // console.log('[RoomsController] joinRoom called with', {
    //   user,
    //   room,
    // });


    // 1. Verificar se room já existe no cache
    const userId = (user.id = socket.id);
    const roomId = room.id ?? '';


    const updatedUser = this.#updateGlobalUserData(userId, user, roomId);
    const updatedRoom = this.#joinUserRoom(updatedUser, room, socket);

    // console.log(
    //   `[RoomsController] User: ${JSON.stringify(updatedUser.toJSON())} joined room :${JSON.stringify(updatedRoom.toJSON())}`
    // );

    // A notificação para o passageiro
    this.#replyWithActiveUsers(socket, updatedRoom.interestedDrivers);
  }

  // ======================================================
  // MÉTODOS PRIVADOS
  // ======================================================

  /** Lida com desconexão e limpeza */
  #handleDisconnect(socket: Socket): void {
    const userId = socket.id;
    const user = this.#users.get(socket.id);
    console.log('[RoomsController] Handling disconnect for user:', userId);
    if (!user) return;

  }

  /** Cria ou atualiza uma sala existente */
  #joinUserRoom(user: User, room: Partial<Room>, socket?: Socket): Room {
    const roomId = room.id ?? '';
    const existingRoom = this.rooms.get(roomId);

    const owner: User = existingRoom ? existingRoom.owner : user;
    const users: Set<User> = existingRoom ? new Set(existingRoom.interestedDrivers) : new Set();

    users.add(user);

    const updatedRoom = new Room({
      id: roomId,
      owner,
      interestedDrivers: users,
      origin: room.origin ?? existingRoom?.origin,
      destination: room.destination ?? existingRoom?.destination,
      status: room.status ?? existingRoom?.status ?? "requested",
      assignedDriver: room.assignedDriver ?? existingRoom?.assignedDriver ?? null,
      price: room.price,
      distance: room.distance ?? existingRoom?.distance,
      duration: room.duration ?? existingRoom?.duration,
      created_at: existingRoom?.created_at ?? new Date(),
      updated_at: new Date(),
    });


    this.rooms.set(roomId, updatedRoom);
    if (socket) socket.join(roomId);

    return updatedRoom;
  }

  /** Atualiza o cache global de usuários */
  #updateGlobalUserData(userId: string, userData: Partial<User> = {}, roomId = ''): User {
    const existing = this.#users.get(userId) ?? {};
    const updated = new User({
      ...existing,
      ...userData,
      roomId,
    });
    this.#users.set(userId, updated);
    return updated;
  }

  /** Envia lista de usuários ativos da room para o socket atual */
  #replyWithActiveUsers(socket: Socket, users: Set<User>): void {
    socket.emit(constants.event.JOIN_ROOM, [...users].map((u) => u.toJSON()));
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
