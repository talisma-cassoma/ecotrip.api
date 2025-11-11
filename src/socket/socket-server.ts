import { Server, Socket, Namespace } from "socket.io";
import { constants } from "./constants";
import * as http from "http";

interface RouteConfigItem {
  [namespace: string]: {
    events: Map<string, (socket: Socket, ...args: any[]) => void>;
    eventEmitter: NodeJS.EventEmitter;
  };
}

interface AttachEventsParams {
  routeConfig: RouteConfigItem[];
}

export default class SocketServer {
  #io!: Server;
  namespaces: Record<string, Namespace> = {};
  port: number;

  constructor(port: number) {
    this.port = port;
  }

  attachToHttpServer(server: http.Server) {
    this.#io = new Server(server, {
      cors: { origin: "*", credentials: false },
    });
  }
  get io(): Server {
    return this.#io;
  }

  attachEvents({ routeConfig }: AttachEventsParams) {
    for (const routes of routeConfig) {
      for (const [namespace, { events, eventEmitter }] of Object.entries(routes)) {
        const route = (this.namespaces[namespace] = this.#io.of(`/${namespace}`));

        route.on("connection", (socket: Socket) => {
          console.log(`🔌 Novo cliente conectado em /${namespace}:`, socket.id);

          // Registra eventos do controller
          for (const [eventName, handler] of events.entries()) {
            socket.on(eventName, (...args) => handler(socket, ...args));
          }

          // Notifica o controlador via EventEmitter
          eventEmitter.emit(constants.event.USER_CONNECTED, socket);

          // Mensagem de boas-vindas
          socket.emit(constants.event.USER_CONNECTED, {
            id: socket.id,
            message: "Bem-vindo!",
          });

          // Desconexão
          socket.on("disconnect", () => {
            eventEmitter.emit(constants.event.USER_DISCONNECTED, socket);
          });
        });
      }
    }
  }
}
