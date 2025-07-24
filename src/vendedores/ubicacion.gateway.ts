import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({ cors: true })
export class UbicacionGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('ubicacion_actualizada')
  handleUbicacionActualizada(@MessageBody() data: any) {
    // Broadcast a todos los clientes
    this.server.emit('ubicacion_actualizada', data);
  }
} 