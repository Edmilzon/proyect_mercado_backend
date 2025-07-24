import { Controller, Post, Body, Get, Param, UseGuards } from '@nestjs/common';
import { VendedoresService } from './vendedores.service';
import { CrearVendedorDto } from './dto/crear-vendedor.dto';
import { CrearUbicacionDto } from './dto/crear-ubicacion.dto';
import { JwtAuthGuard } from '../autenticacion/jwt-auth.guard';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from '../usuarios/usuario.entity';

@Controller('vendedores')
export class VendedoresController {
  constructor(
    private readonly vendedoresService: VendedoresService,
    @InjectRepository(Usuario)
    private readonly usuarioRepositorio: Repository<Usuario>,
  ) {}

  @Post()
  async crear(@Body() datos: CrearVendedorDto) {
    const vendedor = await this.vendedoresService.crearVendedor(datos);
    return { mensaje: 'Vendedor registrado correctamente', vendedor };
  }

  @Get()
  async listar() {
    // Obtener todos los vendedores y sus datos de usuario
    const vendedores = await this.vendedoresService.listarVendedores();
    const vendedoresConUsuario = await Promise.all(
      vendedores.map(async (v) => {
        const usuario = await this.usuarioRepositorio.findOne({ where: { usuario_id: v.vendedor_id } });
        return { ...v, usuario };
      })
    );
    return { vendedores: vendedoresConUsuario };
  }

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