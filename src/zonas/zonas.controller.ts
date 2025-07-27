import { Controller, Post, Body, Get, Param, Put, Delete, Query } from '@nestjs/common';
import { ZonasService } from './zonas.service';
import { CrearZonaDto } from './dto/crear-zona.dto';
import { CalcularTarifaDto } from './dto/calcular-tarifa.dto';
import { AsignarZonaDto } from './dto/asignar-zona.dto';
import { OptimizarRutaDto } from './dto/optimizar-ruta.dto';

@Controller('zonas')
export class ZonasController {
  constructor(private readonly zonasService: ZonasService) {}

  @Post()
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
    const zona = await this.zonasService.obtenerZonaPorId(zona_id);
    return { zona };
  }

  @Put(':zona_id')
  async actualizar(@Param('zona_id') zona_id: string, @Body() datos: CrearZonaDto) {
    const zona = await this.zonasService.actualizarZona(zona_id, datos);
    return { mensaje: 'Zona actualizada correctamente', zona };
  }

  @Delete(':zona_id')
  async eliminar(@Param('zona_id') zona_id: string) {
    await this.zonasService.eliminarZona(zona_id);
    return { mensaje: 'Zona eliminada correctamente' };
  }

  @Post('calcular-tarifa')
  async calcularTarifa(@Body() datos: CalcularTarifaDto) {
    const resultado = await this.zonasService.calcularTarifa(datos);
    return { resultado };
  }

  @Post('asignar-vendedor/:vendedor_id')
  async asignarVendedor(@Param('vendedor_id') vendedor_id: string, @Body() datos: AsignarZonaDto) {
    const vendedor = await this.zonasService.asignarVendedorAZona(vendedor_id, datos);
    return { mensaje: 'Vendedor asignado a zona correctamente', vendedor };
  }

  @Delete('remover-vendedor/:vendedor_id')
  async removerVendedor(@Param('vendedor_id') vendedor_id: string) {
    const vendedor = await this.zonasService.removerVendedorDeZona(vendedor_id);
    return { mensaje: 'Vendedor removido de zona correctamente', vendedor };
  }

  @Get(':zona_id/vendedores')
  async listarVendedoresEnZona(@Param('zona_id') zona_id: string) {
    const vendedores = await this.zonasService.listarVendedoresEnZona(zona_id);
    return { vendedores };
  }

  @Post('optimizar-ruta/:vendedor_id')
  async optimizarRuta(@Param('vendedor_id') vendedor_id: string, @Body() datos: OptimizarRutaDto) {
    const resultado = await this.zonasService.optimizarRutaParaVendedor(vendedor_id, datos.pedidos_ids);
    return { resultado };
  }

  @Get('buscar-por-coordenadas')
  async buscarPorCoordenadas(@Query('latitud') latitud: string, @Query('longitud') longitud: string) {
    const zona = await this.zonasService.buscarZonaPorCoordenadas(
      parseFloat(latitud),
      parseFloat(longitud)
    );
    return { zona };
  }
} 