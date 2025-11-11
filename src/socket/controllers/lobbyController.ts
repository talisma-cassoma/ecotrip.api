import { Socket } from 'socket.io';
import { EventEmitter } from 'events';
import { constants } from '../constants';
import CustomMap from '../customMap';
import Room from '../entities/room';


/**
 * Controla o lobby (lista de rooms visíveis a todos os usuários).
 * Faz broadcast das atualizações enviadas pelo RoomsController.
 */
interface LobbyControllerOptions {
  activeRooms: CustomMap<string, Room, ReturnType<Room['toJSON']>>;
  roomsListener: EventEmitter;
}

export default class LobbyController {
  private activeRooms: CustomMap<string, Room, ReturnType<Room['toJSON']>>;
  private roomsListener: EventEmitter;
  private lobbySockets: Set<Socket> = new Set();

  constructor({ activeRooms, roomsListener }: LobbyControllerOptions) {
    this.activeRooms = activeRooms;
    this.roomsListener = roomsListener;
  }

  /** Quando um socket entra no lobby */
  onNewConnection(socket: Socket): void {
    console.log('[LobbyController] New socket joined lobby:', socket.id);
    this.lobbySockets.add(socket);

    // Envia rooms atuais
    this.#sendLobbyUpdate(socket);

    // Proxy de eventos
    this.#activateEventProxy(socket);

    socket.on('disconnect', () => {
      this.lobbySockets.delete(socket);
    });
  }

  /** 🔹 Desconexão de socket */
  disconnect(socket: Socket): void {
    console.log('[RoomsController] disconnect!!', socket.id);
    this.lobbySockets.delete(socket);
  }

  /** Escuta alterações vindas do RoomsController */
  #activateEventProxy(socket: Socket): void {
    const listener = (rooms: ReturnType<Room['toJSON']>[]) => {
      this.#broadcastLobbyUpdate(rooms);
    };

    this.roomsListener.on(constants.event.LOBBY_UPDATED, listener);

    socket.on('disconnect', () => {
      this.roomsListener.off(constants.event.LOBBY_UPDATED, listener);
    });
  }

  /** Envia rooms atuais para um único socket */
  #sendLobbyUpdate(socket: Socket): void {
    const rooms = [...this.activeRooms.mappedValues()];
    console.log('[LobbyController] Sending lobby update to', socket.id, JSON.stringify(rooms));
     this.#broadcastLobbyUpdate(rooms);
  }

  /** Broadcast: envia atualização para todos os sockets no lobby */
  #broadcastLobbyUpdate(rooms: ReturnType<Room['toJSON']>[]): void {
    for (const socket of this.lobbySockets) {
      socket.emit(constants.event.LOBBY_UPDATED, rooms);
    }
  }

  /** Retorna métodos públicos */
  getEvents(): Map<string | symbol, (...args: any[]) => void> {
    const fns = Reflect.ownKeys(LobbyController.prototype)
      .filter((fn) => fn !== 'constructor')
      .map((name): [string | symbol, (...args: any[]) => void] => [
        name,
        (this as any)[name].bind(this),
      ]);
    return new Map(fns);
  }
}
