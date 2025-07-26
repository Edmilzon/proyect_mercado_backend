import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Conversacion } from './conversacion.entity';
import { ParticipanteConversacion } from './participante-conversacion.entity';
import { Mensaje } from './mensaje.entity';
import { ChatService } from './chat.service';
import { ChatController, MensajesController } from './chat.controller';
import { ChatGateway } from './chat.gateway';
import { Usuario } from '../usuarios/usuario.entity';
import { Pedido } from '../pedidos/pedido.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Conversacion, ParticipanteConversacion, Mensaje, Usuario, Pedido])],
  providers: [ChatService, ChatGateway],
  controllers: [ChatController, MensajesController],
  exports: [ChatService, ChatGateway],
})
export class ChatModule {} 