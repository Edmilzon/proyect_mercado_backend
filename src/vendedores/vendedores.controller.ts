import { Controller, Post, Body, Get, Param, UseGuards, Query } from '@nestjs/common';
import { VendedoresService } from './vendedores.service';
import { CrearVendedorDto } from './dto/crear-vendedor.dto';
import { ConvertirVendedorDto } from './dto/convertir-vendedor.dto';
import { CrearUbicacionDto } from './dto/crear-ubicacion.dto';
import { JwtAuthGuard } from '../autenticacion/jwt-auth.guard';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from '../usuarios/usuario.entity';
import { ResenasService } from '../resenas/resenas.service';

@Controller('vendedores')
export class VendedoresController {
  constructor(
    private readonly vendedoresService: VendedoresService,
    @InjectRepository(Usuario)
    private readonly usuarioRepositorio: Repository<Usuario>,
    private readonly resenasService: ResenasService,
  ) {}

  // ===== DASHBOARD Y ESTADÍSTICAS =====
  @UseGuards(JwtAuthGuard)
  @Get(':vendedor_id/dashboard')
  async obtenerDashboard(@Param('vendedor_id') vendedor_id: string) {
    const dashboard = await this.vendedoresService.obtenerDashboard(vendedor_id);
    return { dashboard };
  }

  // ===== PRODUCTOS DEL VENDEDOR =====
  @UseGuards(JwtAuthGuard)
  @Get(':vendedor_id/productos')
  async listarProductosDelVendedor(
    @Param('vendedor_id') vendedor_id: string,
    @Query('esta_activo') esta_activo?: string,
    @Query('categoria_id') categoria_id?: string,
    @Query('nombre') nombre?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const filtros = {
      esta_activo: esta_activo ? esta_activo === 'true' : undefined,
      categoria_id,
      nombre,
      limit: limit ? parseInt(limit) : 20,
      offset: offset ? parseInt(offset) : 0,
    };

    const resultado = await this.vendedoresService.listarProductosDelVendedor(vendedor_id, filtros);
    return resultado;
  }

  // ===== PEDIDOS DEL VENDEDOR =====
  @UseGuards(JwtAuthGuard)
  @Get(':vendedor_id/pedidos')
  async listarPedidosDelVendedor(
    @Param('vendedor_id') vendedor_id: string,
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

    const resultado = await this.vendedoresService.listarPedidosDelVendedor(vendedor_id, filtros);
    return resultado;
  }

  // ===== CHAT DEL PEDIDO =====
  @UseGuards(JwtAuthGuard)
  @Get('pedidos/:pedido_id/chat')
  async obtenerChatDelPedido(
    @Param('pedido_id') pedido_id: string,
    @Query('vendedor_id') vendedor_id: string,
  ) {
    const chat = await this.vendedoresService.obtenerChatDelPedido(pedido_id, vendedor_id);
    return { chat };
  }

  // ===== CONVERSIÓN A VENDEDOR =====
  @Post('convertir-usuario')
  async convertirUsuarioEnVendedor(@Body() datos: ConvertirVendedorDto) {
    const resultado = await this.vendedoresService.convertirUsuarioEnVendedor(datos);
    return { 
      mensaje: 'Usuario convertido a vendedor correctamente', 
      vendedor: resultado.vendedor,
      usuario: resultado.usuario
    };
  }

  // ===== GESTIÓN BÁSICA DE VENDEDORES =====
  @Post()
  async crear(@Body() datos: CrearVendedorDto) {
    const vendedor = await this.vendedoresService.crearVendedor(datos);
    return { mensaje: 'Vendedor registrado correctamente', vendedor };
  }

  @Get()
  async listar() {
    const vendedores = await this.vendedoresService.listarVendedores();
    return { vendedores };
  }

  @Get(':vendedor_id')
  async obtenerPorId(@Param('vendedor_id') vendedor_id: string) {
    const vendedor = await this.vendedoresService.obtenerVendedorPorId(vendedor_id);
    return { vendedor };
  }

  @Get(':vendedor_id/calificacion')
  async obtenerCalificacion(@Param('vendedor_id') vendedor_id: string) {
    const calificacion = await this.vendedoresService.obtenerCalificacion(vendedor_id);
    return { calificacion };
  }

  // ===== UBICACIÓN =====
  @UseGuards(JwtAuthGuard)
  @Post('ubicaciones')
  async crearUbicacion(@Body() datos: CrearUbicacionDto) {
    const ubicacion = await this.vendedoresService.crearUbicacion(datos);
    return { mensaje: 'Ubicación registrada correctamente', ubicacion };
  }

  @UseGuards(JwtAuthGuard)
  @Get(':vendedor_id/ubicaciones')
  async listarUbicaciones(@Param('vendedor_id') vendedor_id: string) {
    const ubicaciones = await this.vendedoresService.listarUbicaciones(vendedor_id);
    return { ubicaciones };
  }
} 