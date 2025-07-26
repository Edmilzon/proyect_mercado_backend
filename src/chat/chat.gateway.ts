import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { CrearMensajeDto } from './dto/crear-mensaje.dto';
import { UseGuards } from '@nestjs/common';
// import { WsJwtGuard } from '../autenticacion/ws-jwt.guard';

@WebSocketGateway({
  cors: {
    origin: "*",
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedUsers = new Map<string, Socket>();

  constructor(private readonly chatService: ChatService) {}

  async handleConnection(client: Socket) {
    try {
      // Extraer token del handshake
      const token = client.handshake.auth.token || client.handshake.headers.authorization;
      
      if (!token) {
        client.disconnect();
        return;
      }

      // Aquí deberías validar el token JWT
      // Por simplicidad, asumimos que el token es válido
      // En producción, deberías usar un guard de WebSocket
      
      const usuario_id = client.handshake.auth.usuario_id;
      if (usuario_id) {
        this.connectedUsers.set(usuario_id, client);
        client.join(`usuario_${usuario_id}`);
        console.log(`Usuario ${usuario_id} conectado`);
      }
    } catch (error) {
      console.error('Error en conexión WebSocket:', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const usuario_id = client.handshake.auth.usuario_id;
    if (usuario_id) {
      this.connectedUsers.delete(usuario_id);
      console.log(`Usuario ${usuario_id} desconectado`);
    }
  }

  @SubscribeMessage('unirse_conversacion')
  async handleUnirseConversacion(
    @MessageBody() data: { conversacion_id: string },
    @ConnectedSocket() client: Socket,
  ) {
    const usuario_id = client.handshake.auth.usuario_id;
    if (usuario_id) {
      client.join(`conversacion_${data.conversacion_id}`);
      console.log(`Usuario ${usuario_id} se unió a conversación ${data.conversacion_id}`);
    }
  }

  @SubscribeMessage('salir_conversacion')
  async handleSalirConversacion(
    @MessageBody() data: { conversacion_id: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(`conversacion_${data.conversacion_id}`);
    console.log(`Usuario salió de conversación ${data.conversacion_id}`);
  }

  @SubscribeMessage('enviar_mensaje')
  async handleEnviarMensaje(
    @MessageBody() data: CrearMensajeDto,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const usuario_id = client.handshake.auth.usuario_id;
      if (!usuario_id) {
        client.emit('error', { mensaje: 'Usuario no autenticado' });
        return;
      }

      // Crear mensaje en la base de datos
      const mensaje = await this.chatService.crearMensaje(data, usuario_id);

      // Emitir mensaje a todos los participantes de la conversación
      this.server.to(`conversacion_${data.conversacion_id}`).emit('nuevo_mensaje', {
        mensaje,
        conversacion_id: data.conversacion_id,
      });

      // Emitir confirmación al remitente
      client.emit('mensaje_enviado', { mensaje_id: mensaje.mensaje_id });

    } catch (error) {
      console.error('Error enviando mensaje:', error);
      client.emit('error', { mensaje: 'Error al enviar mensaje' });
    }
  }

  @SubscribeMessage('marcar_leido')
  async handleMarcarLeido(
    @MessageBody() data: { conversacion_id: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const usuario_id = client.handshake.auth.usuario_id;
      if (!usuario_id) {
        client.emit('error', { mensaje: 'Usuario no autenticado' });
        return;
      }

      await this.chatService.marcarMensajesComoLeidos(data.conversacion_id, usuario_id);

      // Notificar a otros participantes que los mensajes fueron leídos
      this.server.to(`conversacion_${data.conversacion_id}`).emit('mensajes_leidos', {
        conversacion_id: data.conversacion_id,
        leido_por: usuario_id,
        timestamp: new Date(),
      });

    } catch (error) {
      console.error('Error marcando mensajes como leídos:', error);
      client.emit('error', { mensaje: 'Error al marcar mensajes como leídos' });
    }
  }

  @SubscribeMessage('escribiendo')
  async handleEscribiendo(
    @MessageBody() data: { conversacion_id: string; escribiendo: boolean },
    @ConnectedSocket() client: Socket,
  ) {
    const usuario_id = client.handshake.auth.usuario_id;
    if (usuario_id) {
      // Notificar a otros participantes que alguien está escribiendo
      client.to(`conversacion_${data.conversacion_id}`).emit('usuario_escribiendo', {
        conversacion_id: data.conversacion_id,
        usuario_id,
        escribiendo: data.escribiendo,
      });
    }
  }

  // Método para enviar notificaciones a usuarios específicos
  async enviarNotificacion(usuario_id: string, evento: string, datos: any) {
    const client = this.connectedUsers.get(usuario_id);
    if (client) {
      client.emit(evento, datos);
    }
  }

  // Método para enviar mensaje a una conversación específica
  async enviarMensajeConversacion(conversacion_id: string, evento: string, datos: any) {
    this.server.to(`conversacion_${conversacion_id}`).emit(evento, datos);
  }

  // Método para enviar mensaje a todos los usuarios conectados
  async enviarMensajeGlobal(evento: string, datos: any) {
    this.server.emit(evento, datos);
  }
} 