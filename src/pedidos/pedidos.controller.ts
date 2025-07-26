import { Controller, Post, Body, Get, Put, Delete, Param, UseGuards, Request } from '@nestjs/common';
import { PedidosService } from './pedidos.service';
import { CrearPedidoDto } from './dto/crear-pedido.dto';
import { ActualizarEstadoDto } from './dto/actualizar-estado.dto';
import { JwtAuthGuard } from '../autenticacion/jwt-auth.guard';

@Controller('pedidos')
export class PedidosController {
  constructor(private readonly pedidosService: PedidosService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async crear(@Body() datos: CrearPedidoDto, @Request() req) {
    // Verificar que el usuario autenticado es el comprador
    if (req.user.usuario_id !== datos.comprador_id) {
      throw new Error('No autorizado para crear pedidos para otro usuario');
    }

    const pedido = await this.pedidosService.crearPedido(datos);
    return { 
      mensaje: 'Pedido creado correctamente', 
      pedido,
      codigo_qr: pedido.url_codigo_qr
    };
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async listar(@Request() req) {
    // Solo admins pueden ver todos los pedidos
    if (req.user.rol !== 'admin' && req.user.rol !== 'super_admin') {
      throw new Error('No autorizado para ver todos los pedidos');
    }

    const pedidos = await this.pedidosService.listarPedidos();
    return { pedidos };
  }

  @Get('mis-pedidos')
  @UseGuards(JwtAuthGuard)
  async misPedidos(@Request() req) {
    const pedidos = await this.pedidosService.listarPorComprador(req.user.usuario_id);
    return { pedidos };
  }

  @Get('vendedor/:vendedor_id')
  @UseGuards(JwtAuthGuard)
  async pedidosVendedor(@Param('vendedor_id') vendedor_id: string, @Request() req) {
    // Verificar que el usuario autenticado es el vendedor o admin
    if (req.user.usuario_id !== vendedor_id && req.user.rol !== 'admin' && req.user.rol !== 'super_admin') {
      throw new Error('No autorizado para ver pedidos de otro vendedor');
    }

    const pedidos = await this.pedidosService.listarPorVendedor(vendedor_id);
    return { pedidos };
  }

  @Get(':pedido_id')
  @UseGuards(JwtAuthGuard)
  async obtenerPorId(@Param('pedido_id') pedido_id: string, @Request() req) {
    const pedido = await this.pedidosService.buscarPorId(pedido_id);
    if (!pedido) {
      return { mensaje: 'Pedido no encontrado' };
    }

    // Verificar autorización
    const puedeVer = req.user.usuario_id === pedido.comprador_id || 
                    req.user.usuario_id === pedido.vendedor_id ||
                    req.user.rol === 'admin' || 
                    req.user.rol === 'super_admin';

    if (!puedeVer) {
      throw new Error('No autorizado para ver este pedido');
    }

    return { pedido };
  }

  @Put(':pedido_id/estado')
  @UseGuards(JwtAuthGuard)
  async actualizarEstado(
    @Param('pedido_id') pedido_id: string, 
    @Body() datos: ActualizarEstadoDto,
    @Request() req
  ) {
    const pedido = await this.pedidosService.buscarPorId(pedido_id);
    if (!pedido) {
      throw new Error('Pedido no encontrado');
    }

    // Solo el vendedor o admin puede cambiar el estado
    const puedeCambiar = req.user.usuario_id === pedido.vendedor_id ||
                        req.user.rol === 'admin' || 
                        req.user.rol === 'super_admin';

    if (!puedeCambiar) {
      throw new Error('No autorizado para cambiar el estado de este pedido');
    }

    const pedidoActualizado = await this.pedidosService.actualizarEstado(pedido_id, datos);
    return { 
      mensaje: 'Estado del pedido actualizado correctamente', 
      pedido: pedidoActualizado 
    };
  }

  @Delete(':pedido_id')
  @UseGuards(JwtAuthGuard)
  async eliminar(@Param('pedido_id') pedido_id: string, @Request() req) {
    const pedido = await this.pedidosService.buscarPorId(pedido_id);
    if (!pedido) {
      throw new Error('Pedido no encontrado');
    }

    // Solo el comprador o admin puede eliminar
    const puedeEliminar = req.user.usuario_id === pedido.comprador_id ||
                         req.user.rol === 'admin' || 
                         req.user.rol === 'super_admin';

    if (!puedeEliminar) {
      throw new Error('No autorizado para eliminar este pedido');
    }

    await this.pedidosService.eliminarPedido(pedido_id);
    return { mensaje: 'Pedido eliminado correctamente' };
  }
} 