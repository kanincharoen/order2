import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({ cors: { origin: '*' } })
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(EventsGateway.name);
  private connectedClients = new Map<string, Socket>();

  handleConnection(client: Socket): void {
    this.connectedClients.set(client.id, client);
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket): void {
    this.connectedClients.delete(client.id);
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('sync')
  handleSync(): { event: string; data: { message: string } } {
    return { event: 'sync', data: { message: 'sync_acknowledged' } };
  }

  emitTableStatusChange(table: any): void {
    this.server.emit('table:status_changed', table);
  }

  emitOrderStatusChange(order: any): void {
    this.server.emit('order:status_changed', order);
  }

  emitOrderCreated(order: any): void {
    this.server.emit('order:created', order);
  }

  emitMenuItemChange(menuItem: any): void {
    this.server.emit('menu:item_changed', menuItem);
  }

  emitQrCodeGenerated(tableId: string, qrCode: any): void {
    this.server.emit('qr:generated', { tableId, qrCode });
  }

  emitQrCodeInvalidated(tableId: string): void {
    this.server.emit('qr:invalidated', { tableId });
  }
}
