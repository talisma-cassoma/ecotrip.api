import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import SocketServer from "./socket/socket-server";
import RoomsController from "./socket/controllers/roomController";
import LobbyController from "./socket/controllers/lobbyController";
import { EventEmitter } from "events";
import { constants } from "./socket/constants";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const server = app.getHttpServer();

  const port = Number(process.env.PORT) || 3000;

  // 🔹 Instancia o servidor Socket.IO
  const socketServer = new SocketServer(port);
  socketServer.attachToHttpServer(server);

  // 🔹 Canal interno de comunicação
  const roomsPubSub = new EventEmitter();

  // 🔹 Controladores
  const roomsController = new RoomsController({ roomsPubSub });
  const lobbyController = new LobbyController({
    activeRooms: roomsController.rooms,
    roomsListener: roomsPubSub,
  });

  // 🔹 Namespaces
  const namespaces = {
    room: { controller: roomsController, eventEmitter: new EventEmitter() },
    lobby: { controller: lobbyController, eventEmitter: new EventEmitter() },
  };

  // Conexão
  namespaces.room.eventEmitter.on(
    constants.event.USER_CONNECTED,
    roomsController.onNewConnection.bind(roomsController)
  );
  namespaces.room.eventEmitter.on(
    constants.event.USER_DISCONNECTED,
    roomsController.disconnect.bind(roomsController)
  );

  namespaces.lobby.eventEmitter.on(
    constants.event.USER_CONNECTED,
    lobbyController.onNewConnection.bind(lobbyController)
  );

  // 🔹 Monta o routeConfig
  const routeConfig = Object.entries(namespaces).map(
    ([namespace, { controller, eventEmitter }]) => ({
      [namespace]: { events: controller.getEvents(), eventEmitter },
    })
  );

  // 🔹 Anexa eventos ao servidor Socket.IO
  socketServer.attachEvents({ routeConfig: routeConfig as any  });

  await app.listen(port);
  console.log(`🚀 NestJS + Socket.IO rodando na porta ${port}`);
}

bootstrap();
