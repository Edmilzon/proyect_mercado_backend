import { Controller, Post, Body, Get, Put, Delete, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ChatService } from './chat.service';
import { CrearConversacionDto } from './dto/crear-conversacion.dto';
import { CrearMensajeDto } from './dto/crear-mensaje.dto';
import { BuscarConversacionDto } from './dto/buscar-conversacion.dto';
import { JwtAuthGuard } from '../autenticacion/jwt-auth.guard';

@Controller('conversaciones')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async crearConversacion(@Body() datos: CrearConversacionDto, @Request() req) {
    // Verificar que el usuario autenticado está en los participantes
    if (!datos.participantes.includes(req.user.usuario_id)) {
      throw new Error('Debes incluirte como participante de la conversación');
    }

    const conversacion = await this.chatService.crearConversacion(datos);
    return { mensaje: 'Conversación creada correctamente', conversacion };
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async listarConversaciones() {
    const conversaciones = await this.chatService.listarConversaciones();
    return { conversaciones };
  }

  @Get('buscar')
  @UseGuards(JwtAuthGuard)
  async buscarConversaciones(@Query() filtros: BuscarConversacionDto) {
    const resultado = await this.chatService.buscarConversaciones(filtros);
    return resultado;
  }

  @Get('usuario/:usuario_id')
  @UseGuards(JwtAuthGuard)
  async listarConversacionesPorUsuario(@Param('usuario_id') usuario_id: string, @Request() req) {
    // Verificar autorización
    if (req.user.usuario_id !== usuario_id && req.user.rol !== 'admin' && req.user.rol !== 'super_admin') {
      throw new Error('No autorizado para ver conversaciones de otro usuario');
    }

    const conversaciones = await this.chatService.listarConversacionesPorUsuario(usuario_id);
    return { conversaciones };
  }

  @Get(':conversacion_id')
  @UseGuards(JwtAuthGuard)
  async obtenerConversacion(@Param('conversacion_id') conversacion_id: string) {
    const conversacion = await this.chatService.buscarConversacionPorId(conversacion_id);
    if (!conversacion) {
      return { mensaje: 'Conversación no encontrada' };
    }
    return { conversacion };
  }

  @Put(':conversacion_id/estado')
  @UseGuards(JwtAuthGuard)
  async cambiarEstado(@Param('conversacion_id') conversacion_id: string, @Body() datos: { estado: string }) {
    const conversacion = await this.chatService.cambiarEstadoConversacion(conversacion_id, datos.estado);
    return { mensaje: 'Estado de conversación actualizado correctamente', conversacion };
  }

  @Post(':conversacion_id/participantes')
  @UseGuards(JwtAuthGuard)
  async agregarParticipante(@Param('conversacion_id') conversacion_id: string, @Body() datos: { usuario_id: string }) {
    const participante = await this.chatService.agregarParticipante(conversacion_id, datos.usuario_id);
    return { mensaje: 'Participante agregado correctamente', participante };
  }

  @Delete(':conversacion_id/participantes/:usuario_id')
  @UseGuards(JwtAuthGuard)
  async removerParticipante(@Param('conversacion_id') conversacion_id: string, @Param('usuario_id') usuario_id: string) {
    await this.chatService.removerParticipante(conversacion_id, usuario_id);
    return { mensaje: 'Participante removido correctamente' };
  }
}

@Controller('mensajes')
export class MensajesController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async crearMensaje(@Body() datos: CrearMensajeDto, @Request() req) {
    const mensaje = await this.chatService.crearMensaje(datos, req.user.usuario_id);
    return { mensaje: 'Mensaje enviado correctamente', datos: mensaje };
  }

  @Get('conversacion/:conversacion_id')
  @UseGuards(JwtAuthGuard)
  async listarMensajes(@Param('conversacion_id') conversacion_id: string) {
    const mensajes = await this.chatService.listarMensajes(conversacion_id);
    return { mensajes };
  }

  @Get(':mensaje_id')
  @UseGuards(JwtAuthGuard)
  async obtenerMensaje(@Param('mensaje_id') mensaje_id: string) {
    const mensaje = await this.chatService.buscarMensajePorId(mensaje_id);
    if (!mensaje) {
      return { mensaje: 'Mensaje no encontrado' };
    }
    return { mensaje };
  }

  @Put('conversacion/:conversacion_id/leer')
  @UseGuards(JwtAuthGuard)
  async marcarComoLeidos(@Param('conversacion_id') conversacion_id: string, @Request() req) {
    await this.chatService.marcarMensajesComoLeidos(conversacion_id, req.user.usuario_id);
    return { mensaje: 'Mensajes marcados como leídos' };
  }

  @Get('usuario/:usuario_id/no-leidos')
  @UseGuards(JwtAuthGuard)
  async obtenerNoLeidos(@Param('usuario_id') usuario_id: string, @Request() req) {
    // Verificar autorización
    if (req.user.usuario_id !== usuario_id && req.user.rol !== 'admin' && req.user.rol !== 'super_admin') {
      throw new Error('No autorizado para ver mensajes no leídos de otro usuario');
    }

    const noLeidos = await this.chatService.obtenerMensajesNoLeidos(usuario_id);
    return { no_leidos: noLeidos };
  }

  @Delete(':mensaje_id')
  @UseGuards(JwtAuthGuard)
  async eliminarMensaje(@Param('mensaje_id') mensaje_id: string, @Request() req) {
    await this.chatService.eliminarMensaje(mensaje_id, req.user.usuario_id);
    return { mensaje: 'Mensaje eliminado correctamente' };
  }
} 