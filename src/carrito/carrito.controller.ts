import { Controller, Post, Body, Get, Query, UseGuards } from '@nestjs/common';
import { CarritoService } from './carrito.service';
import { ItemCarritoDto } from './dto/item-carrito.dto';
import { JwtAuthGuard } from '../autenticacion/jwt-auth.guard';

@Controller('carrito')
export class CarritoController {
  constructor(private readonly carritoService: CarritoService) {}

  @Post('calcular')
  @UseGuards(JwtAuthGuard)
  async calcular(@Body() datos: { items: ItemCarritoDto[] }) {
    const resultado = await this.carritoService.calcularCarrito(datos.items);
    return resultado;
  }

  @Post('validar-stock')
  @UseGuards(JwtAuthGuard)
  async validarStock(@Body() datos: { items: ItemCarritoDto[] }) {
    const resultado = await this.carritoService.validarStock(datos.items);
    return resultado;
  }

  @Get('calcular-envio')
  @UseGuards(JwtAuthGuard)
  async calcularEnvio(
    @Query('subtotal') subtotal: string,
    @Query('zona_id') zona_id?: string
  ) {
    const resultado = await this.carritoService.calcularEnvio(parseFloat(subtotal), zona_id);
    return resultado;
  }

  @Get('calcular-descuentos')
  @UseGuards(JwtAuthGuard)
  async calcularDescuentos(
    @Query('subtotal') subtotal: string,
    @Query('codigo_descuento') codigo_descuento?: string
  ) {
    const resultado = await this.carritoService.calcularDescuentos(parseFloat(subtotal), codigo_descuento);
    return resultado;
  }

  @Post('resumen-completo')
  @UseGuards(JwtAuthGuard)
  async resumenCompleto(@Body() datos: { 
    items: ItemCarritoDto[];
    zona_id?: string;
    codigo_descuento?: string;
  }) {
    // Calcular carrito
    const carrito = await this.carritoService.calcularCarrito(datos.items);
    
    // Calcular envío
    const envio = await this.carritoService.calcularEnvio(carrito.subtotal, datos.zona_id);
    
    // Calcular descuentos
    const descuentos = await this.carritoService.calcularDescuentos(carrito.subtotal, datos.codigo_descuento);
    
    // Calcular total final
    const total_final = carrito.subtotal + envio.costo_envio - descuentos.monto_descuento;

    return {
      items: carrito.items,
      subtotal: carrito.subtotal,
      total_items: carrito.total_items,
      envio,
      descuentos,
      total_final,
      resumen: {
        subtotal: carrito.subtotal,
        costo_envio: envio.costo_envio,
        descuento: descuentos.monto_descuento,
        total: total_final
      }
    };
  }
} 