import { Controller, Post, Body, Get, Put, Param, UseGuards } from '@nestjs/common';
import { PagosService } from './pagos.service';
import { CrearPagoDto } from './dto/crear-pago.dto';
import { JwtAuthGuard } from '../autenticacion/jwt-auth.guard';

@Controller('pagos')
export class PagosController {
  constructor(private readonly pagosService: PagosService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async crear(@Body() datos: CrearPagoDto) {
    const pago = await this.pagosService.crearPago(datos);
    return { mensaje: 'Pago registrado correctamente', pago };
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async listar() {
    const pagos = await this.pagosService.listarPagos();
    return { pagos };
  }

  @Get(':pago_id')
  @UseGuards(JwtAuthGuard)
  async obtenerPorId(@Param('pago_id') pago_id: string) {
    const pago = await this.pagosService.buscarPorId(pago_id);
    if (!pago) {
      return { mensaje: 'Pago no encontrado' };
    }
    return { pago };
  }

  @Get('pedido/:pedido_id')
  @UseGuards(JwtAuthGuard)
  async obtenerPorPedido(@Param('pedido_id') pedido_id: string) {
    const pago = await this.pagosService.buscarPorPedido(pedido_id);
    if (!pago) {
      return { mensaje: 'Pago no encontrado para este pedido' };
    }
    return { pago };
  }

  @Put(':pago_id/estado')
  @UseGuards(JwtAuthGuard)
  async actualizarEstado(@Param('pago_id') pago_id: string, @Body() datos: { estado: string }) {
    const pago = await this.pagosService.actualizarEstado(pago_id, datos.estado);
    return { mensaje: 'Estado del pago actualizado correctamente', pago };
  }

  @Get('estado/:estado')
  @UseGuards(JwtAuthGuard)
  async listarPorEstado(@Param('estado') estado: string) {
    const pagos = await this.pagosService.listarPorEstado(estado);
    return { pagos };
  }

  @Get('metodo/:metodo_pago')
  @UseGuards(JwtAuthGuard)
  async listarPorMetodo(@Param('metodo_pago') metodo_pago: string) {
    const pagos = await this.pagosService.listarPorMetodo(metodo_pago);
    return { pagos };
  }
} 