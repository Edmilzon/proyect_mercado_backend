import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { CompradoresService } from './compradores.service';
import { JwtAuthGuard } from '../autenticacion/jwt-auth.guard';
import { RolesGuard } from '../autenticacion/roles.guard';
import { Roles } from '../autenticacion/roles.decorator';
import { CrearFavoritoDto } from '../vendedores/dto/crear-favorito.dto';

@Controller('compradores')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('comprador')
export class CompradoresController {
  constructor(private readonly compradoresService: CompradoresService) {}

  // ===== HISTORIAL DE COMPRAS =====
  @Get(':usuario_id/historial-compras')
  async obtenerHistorialCompras(
    @Param('usuario_id') usuario_id: string,
    @Query('estado') estado?: string,
    @Query('fecha_desde') fecha_desde?: string,
    @Query('fecha_hasta') fecha_hasta?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const filtros = {
      estado,
      fecha_desde: fecha_desde ? new Date(fecha_desde) : undefined,
      fecha_hasta: fecha_hasta ? new Date(fecha_hasta) : undefined,
      limit: limit ? parseInt(limit) : 20,
      offset: offset ? parseInt(offset) : 0,
    };

    const resultado = await this.compradoresService.obtenerHistorialCompras(usuario_id, filtros);
    return resultado;
  }

  // ===== FAVORITOS =====
  @Post('favoritos')
  async agregarFavorito(@Body() datos: CrearFavoritoDto) {
    const favorito = await this.compradoresService.agregarFavorito(datos);
    return { mensaje: 'Producto agregado a favoritos', favorito };
  }

  @Get(':usuario_id/favoritos')
  async listarFavoritos(@Param('usuario_id') usuario_id: string) {
    const favoritos = await this.compradoresService.listarFavoritos(usuario_id);
    return { favoritos };
  }

  @Delete(':usuario_id/favoritos/:producto_id')
  async eliminarFavorito(
    @Param('usuario_id') usuario_id: string,
    @Param('producto_id') producto_id: string,
  ) {
    await this.compradoresService.eliminarFavorito(usuario_id, producto_id);
    return { mensaje: 'Producto eliminado de favoritos' };
  }

  @Get(':usuario_id/favoritos/verificar/:producto_id')
  async verificarFavorito(
    @Param('usuario_id') usuario_id: string,
    @Param('producto_id') producto_id: string,
  ) {
    const esFavorito = await this.compradoresService.verificarFavorito(usuario_id, producto_id);
    return { es_favorito: esFavorito };
  }

  // ===== NOTIFICACIONES =====
  @Get(':usuario_id/notificaciones')
  async listarNotificaciones(
    @Param('usuario_id') usuario_id: string,
    @Query('es_leida') es_leida?: string,
    @Query('tipo') tipo?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const filtros = {
      es_leida: es_leida ? es_leida === 'true' : undefined,
      tipo,
      limit: limit ? parseInt(limit) : 20,
      offset: offset ? parseInt(offset) : 0,
    };

    const resultado = await this.compradoresService.listarNotificaciones(usuario_id, filtros);
    return resultado;
  }

  @Put('notificaciones/:notificacion_id/leer')
  async marcarNotificacionComoLeida(
    @Param('notificacion_id') notificacion_id: string,
    @Body() datos: { usuario_id: string }
  ) {
    await this.compradoresService.marcarNotificacionComoLeida(notificacion_id, datos.usuario_id);
    return { mensaje: 'Notificación marcada como leída' };
  }

  @Put(':usuario_id/notificaciones/todas-leidas')
  async marcarTodasNotificacionesComoLeidas(@Param('usuario_id') usuario_id: string) {
    await this.compradoresService.marcarTodasComoLeidas(usuario_id);
    return { mensaje: 'Todas las notificaciones marcadas como leídas' };
  }

  @Get(':usuario_id/notificaciones/contador')
  async obtenerContadorNotificaciones(@Param('usuario_id') usuario_id: string) {
    const contador = await this.compradoresService.obtenerContadorNotificacionesNoLeidas(usuario_id);
    return { notificaciones_no_leidas: contador };
  }

  // ===== CÓDIGOS DE DESCUENTO =====
  @Post('codigos-descuento/validar')
  async validarCodigoDescuento(@Body() datos: {
    codigo: string;
    monto_subtotal: number;
    categoria_id?: string;
  }) {
    const resultado = await this.compradoresService.validarCodigoDescuento(
      datos.codigo,
      datos.monto_subtotal,
      datos.categoria_id,
    );
    return resultado;
  }

  // ===== SEGUIMIENTO DE PEDIDOS =====
  @Get(':usuario_id/seguimiento-pedido/:pedido_id')
  async obtenerSeguimientoPedido(
    @Param('usuario_id') usuario_id: string,
    @Param('pedido_id') pedido_id: string,
  ) {
    const seguimiento = await this.compradoresService.obtenerSeguimientoPedido(pedido_id, usuario_id);
    return seguimiento;
  }

  // ===== ESTADÍSTICAS =====
  @Get(':usuario_id/estadisticas')
  async obtenerEstadisticas(@Param('usuario_id') usuario_id: string) {
    const estadisticas = await this.compradoresService.obtenerEstadisticasComprador(usuario_id);
    return { estadisticas };
  }
} 