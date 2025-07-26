import { Controller, Post, Body, Get, Put, Delete, Param, UseGuards } from '@nestjs/common';
import { ZonasService } from './zonas.service';
import { CrearZonaDto } from './dto/crear-zona.dto';
import { CalcularTarifaDto } from './dto/calcular-tarifa.dto';
import { AsignarZonaDto } from './dto/asignar-zona.dto';
import { OptimizarRutaDto } from './dto/optimizar-ruta.dto';
import { JwtAuthGuard } from '../autenticacion/jwt-auth.guard';

@Controller('zonas-entrega')
export class ZonasController {
  constructor(private readonly zonasService: ZonasService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async crear(@Body() datos: CrearZonaDto) {
    const zona = await this.zonasService.crearZona(datos);
    return { mensaje: 'Zona creada correctamente', zona };
  }

  @Get()
  async listar() {
    const zonas = await this.zonasService.listarZonas();
    return { zonas };
  }

  @Get('activas')
  async listarActivas() {
    const zonas = await this.zonasService.listarZonasActivas();
    return { zonas };
  }

  @Get(':zona_id')
  async obtenerPorId(@Param('zona_id') zona_id: string) {
    const zona = await this.zonasService.buscarPorId(zona_id);
    if (!zona) {
      return { mensaje: 'Zona no encontrada' };
    }
    return { zona };
  }

  @Put(':zona_id')
  @UseGuards(JwtAuthGuard)
  async actualizar(@Param('zona_id') zona_id: string, @Body() datos: Partial<CrearZonaDto>) {
    const zona = await this.zonasService.actualizarZona(zona_id, datos);
    return { mensaje: 'Zona actualizada correctamente', zona };
  }

  @Delete(':zona_id')
  @UseGuards(JwtAuthGuard)
  async eliminar(@Param('zona_id') zona_id: string) {
    await this.zonasService.eliminarZona(zona_id);
    return { mensaje: 'Zona eliminada correctamente' };
  }

  @Post('calcular-tarifa')
  async calcularTarifa(@Body() datos: CalcularTarifaDto) {
    const resultado = await this.zonasService.calcularTarifaEnvio(
      datos.latitud_origen,
      datos.longitud_origen,
      datos.latitud_destino,
      datos.longitud_destino,
      datos.peso_total_g,
      datos.zona_id
    );
    return { resultado };
  }

  @Post('vendedores/:vendedor_id/asignar-zona')
  @UseGuards(JwtAuthGuard)
  async asignarVendedorAZona(@Param('vendedor_id') vendedor_id: string, @Body() datos: AsignarZonaDto) {
    const vendedor = await this.zonasService.asignarVendedorAZona(vendedor_id, datos.zona_id);
    return { mensaje: 'Vendedor asignado a zona correctamente', vendedor };
  }

  @Delete('vendedores/:vendedor_id/asignar-zona')
  @UseGuards(JwtAuthGuard)
  async removerVendedorDeZona(@Param('vendedor_id') vendedor_id: string) {
    const vendedor = await this.zonasService.removerVendedorDeZona(vendedor_id);
    return { mensaje: 'Vendedor removido de zona correctamente', vendedor };
  }

  @Get(':zona_id/vendedores')
  async listarVendedoresPorZona(@Param('zona_id') zona_id: string) {
    const vendedores = await this.zonasService.listarVendedoresPorZona(zona_id);
    return { vendedores };
  }

  @Post('vendedores/:vendedor_id/optimizar-ruta')
  @UseGuards(JwtAuthGuard)
  async optimizarRuta(@Param('vendedor_id') vendedor_id: string, @Body() datos: OptimizarRutaDto) {
    const resultado = await this.zonasService.optimizarRuta(vendedor_id, datos.pedidos_ids);
    return { resultado };
  }

  @Get('buscar-por-coordenadas')
  async encontrarZonaPorCoordenadas(
    @Param('latitud') latitud: string,
    @Param('longitud') longitud: string
  ) {
    const zona = await this.zonasService.encontrarZonaPorCoordenadas(
      parseFloat(latitud),
      parseFloat(longitud)
    );
    if (!zona) {
      return { mensaje: 'No se encontró zona para estas coordenadas' };
    }
    return { zona };
  }
} 