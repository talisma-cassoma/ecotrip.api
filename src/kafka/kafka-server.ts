import { CustomTransportStrategy } from '@nestjs/microservices';
import * as kafkaLib from '@confluentinc/kafka-javascript';
import { Logger } from '@nestjs/common';
import { KafkaContext } from './kafka-context';
// base-kafka-server.ts
import { Server } from '@nestjs/microservices';

export abstract class BaseKafkaServer extends Server {
  // Implementação padrão apenas para satisfazer o compilador
  on<EventKey extends keyof any, EventCallback = any>(event: EventKey, callback: EventCallback): any {
    // noop — ou você pode delegar para um EventEmitter interno se quiser
    return null;
  }

  unwrap<T>(): T {
    return this as unknown as T;
  }
}

export class KafkaServer extends BaseKafkaServer implements CustomTransportStrategy {
  public readonly logger = new Logger(KafkaServer.name);

  private kafkaInst: kafkaLib.KafkaJS.Kafka;
  private consumer: kafkaLib.KafkaJS.Consumer;

  constructor(
    private readonly options: {
      server: kafkaLib.KafkaJS.CommonConstructorConfig;
      consumer: kafkaLib.KafkaJS.ConsumerConstructorConfig;
    },
  ) {
    super();
  }

  private async scheduleReconnect(attempt = 1) {
    const delay = Math.min(30, 2 ** attempt) * 1_000;

    this.logger.warn(`Tentar reconectar em ${delay / 1000}s...`);
    setTimeout(async () => {
      try {
        await this.consumer.connect();
        await this.bindEvents();
        this.logger.log('Reconectado ao Kafka');
      } catch (err) {
        this.logger.error(`Falha na reconexão: ${err.message}`);
        this.scheduleReconnect(attempt + 1);
      }
    }, delay);
  }

  async listen(callback: () => void) {
    this.kafkaInst = new kafkaLib.KafkaJS.Kafka(this.options.server);
    this.consumer = this.kafkaInst.consumer(this.options.consumer);

    try {
      await this.consumer.connect();
      await this.bindEvents();  // incluindo run()
      this.logger.log('Kafka conectado');
    } catch (err) {
      this.logger.error(`Falha na conexão inicial com Kafka: ${err.message}`);
      this.scheduleReconnect();
    } finally {
      callback(); // Garante que o NestJS não morra
    }
  }

  public async bindEvents() {
    const registeredPatterns = [...this.messageHandlers.keys()];
    if (registeredPatterns.length > 0) {
      await this.consumer.subscribe({ topics: registeredPatterns });
    }

    try {
      await this.consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          try {
            const handler = this.getHandlerByPattern(topic);
            if (!handler) {
              this.logger.error(`No handler for topic ${topic}`);
              return;
            }

            const kafkaContext = new KafkaContext(
              message,
              JSON.parse(message.value.toString()),
              topic,
              partition,
              this.consumer,
            );

            await handler(kafkaContext);
          } catch (handlerError) {
            this.logger.error(`Erro ao processar mensagem: ${handlerError.message}`);
          }
        },
      });
    } catch (err) {
      this.logger.error(`Erro no consumer.run: ${err.message}`);
      this.scheduleReconnect();
    }
  }

  async close() {
    this.logger.log('Closing Kafka connection');
    await this.consumer?.disconnect();
    this.consumer = null;
  }
}
