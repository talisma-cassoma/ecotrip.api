// src/rabbitmq/rabbitmq.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import * as amqp from 'amqplib';

@Injectable()
export class RabbitmqService implements OnModuleInit, OnModuleDestroy {
  private connection: amqp.Connection | null = null;
  private channel: amqp.Channel | null = null;
  private readonly exchange = 'conversion_exchange';
  private readonly logger = new Logger(RabbitmqService.name);

  async onModuleInit() {
    try {
      this.connection = await amqp.connect(
        "amqp://admin:1234353543A2&tyyurzu@ecotrip-rabbitmq.onrender.com:5672"
      );
      this.channel = await this.connection.createChannel();

      // garante que o exchange existe
      await this.channel.assertExchange(this.exchange, 'direct', { durable: true });

      this.logger.log('Conectado ao RabbitMQ com sucesso!');
    } catch (err) {
      this.logger.error('Falha ao conectar ao RabbitMQ:', err.message);
      this.connection = null;
      this.channel = null;
    }
  }

  async publish(routingKey: string, message: any) {
    if (!this.channel) {
      this.logger.warn(
        `RabbitMQ indisponível. Mensagem para ${routingKey} não enviada.`
      );
      return;
    }

    try {
      const payload = Buffer.from(JSON.stringify(message));
      this.channel.publish(this.exchange, routingKey, payload, {
        persistent: true,
      });
      this.logger.log(`[x] Published ${routingKey} ${JSON.stringify(message)}`);
    } catch (err) {
      this.logger.error('Erro ao publicar mensagem no RabbitMQ:', err.message);
    }
  }

  async onModuleDestroy() {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
      this.logger.log('Conexão RabbitMQ encerrada com sucesso.');
    } catch (err) {
      this.logger.error('Erro ao encerrar conexão RabbitMQ:', err.message);
    }
  }
}
