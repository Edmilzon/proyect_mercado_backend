import { Controller, Post, Body, Get, Put, Delete, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ResenasService } from './resenas.service';
import { CrearResenaDto } from './dto/crear-resena.dto';
import { BuscarResenaDto } from './dto/buscar-resena.dto';
import { ResponderResenaDto } from './dto/responder-resena.dto';
import { JwtAuthGuard } from '../autenticacion/jwt-auth.guard';

@Controller('resenas')
export class ResenasController {
  constructor(private readonly resenasService: ResenasService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async crear(@Body() datos: CrearResenaDto, @Request() req) {
    // Verificar que el usuario autenticado es el comprador
    if (req.user.usuario_id !== datos.comprador_id) {
      throw new Error('No autorizado para crear reseñas para otro usuario');
    }

    const resena = await this.resenasService.crearResena(datos);
    return { mensaje: 'Reseña creada correctamente', resena };
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async listar() {
    const resenas = await this.resenasService.listarResenas();
    return { resenas };
  }

  @Get('buscar')
  @UseGuards(JwtAuthGuard)
  async buscar(@Query() filtros: BuscarResenaDto) {
    const resultado = await this.resenasService.buscarResenas(filtros);
    return resultado;
  }

  @Get('vendedor/:vendedor_id')
  @UseGuards(JwtAuthGuard)
  async listarPorVendedor(@Param('vendedor_id') vendedor_id: string) {
    const resenas = await this.resenasService.listarPorVendedor(vendedor_id);
    return { resenas };
  }

  @Get('comprador/:comprador_id')
  @UseGuards(JwtAuthGuard)
  async listarPorComprador(@Param('comprador_id') comprador_id: string, @Request() req) {
    // Verificar autorización
    if (req.user.usuario_id !== comprador_id && req.user.rol !== 'admin' && req.user.rol !== 'super_admin') {
      throw new Error('No autorizado para ver reseñas de otro comprador');
    }

    const resenas = await this.resenasService.listarPorComprador(comprador_id);
    return { resenas };
  }

  @Get('pendientes/:comprador_id')
  @UseGuards(JwtAuthGuard)
  async listarPendientes(@Param('comprador_id') comprador_id: string, @Request() req) {
    // Verificar autorización
    if (req.user.usuario_id !== comprador_id && req.user.rol !== 'admin' && req.user.rol !== 'super_admin') {
      throw new Error('No autorizado para ver pedidos pendientes de otro comprador');
    }

    const pedidos = await this.resenasService.listarPendientes(comprador_id);
    return { pedidos };
  }

  @Get(':resena_id')
  @UseGuards(JwtAuthGuard)
  async obtenerPorId(@Param('resena_id') resena_id: string) {
    const resena = await this.resenasService.buscarPorId(resena_id);
    if (!resena) {
      return { mensaje: 'Reseña no encontrada' };
    }
    return { resena };
  }

  @Put(':resena_id/responder')
  @UseGuards(JwtAuthGuard)
  async responder(@Param('resena_id') resena_id: string, @Body() datos: ResponderResenaDto, @Request() req) {
    const resena = await this.resenasService.buscarPorId(resena_id);
    if (!resena) {
      throw new Error('Reseña no encontrada');
    }

    // Solo el vendedor o admin puede responder
    const puedeResponder = req.user.usuario_id === resena.vendedor_id ||
                          req.user.rol === 'admin' || 
                          req.user.rol === 'super_admin';

    if (!puedeResponder) {
      throw new Error('No autorizado para responder esta reseña');
    }

    const resenaActualizada = await this.resenasService.responderResena(resena_id, datos.respuesta_vendedor);
    return { mensaje: 'Respuesta agregada correctamente', resena: resenaActualizada };
  }

  @Put(':resena_id')
  @UseGuards(JwtAuthGuard)
  async actualizar(@Param('resena_id') resena_id: string, @Body() datos: Partial<CrearResenaDto>, @Request() req) {
    const resena = await this.resenasService.buscarPorId(resena_id);
    if (!resena) {
      throw new Error('Reseña no encontrada');
    }

    // Solo el comprador o admin puede actualizar
    const puedeActualizar = req.user.usuario_id === resena.comprador_id ||
                           req.user.rol === 'admin' || 
                           req.user.rol === 'super_admin';

    if (!puedeActualizar) {
      throw new Error('No autorizado para actualizar esta reseña');
    }

    const resenaActualizada = await this.resenasService.actualizarResena(resena_id, datos);
    return { mensaje: 'Reseña actualizada correctamente', resena: resenaActualizada };
  }

  @Delete(':resena_id')
  @UseGuards(JwtAuthGuard)
  async eliminar(@Param('resena_id') resena_id: string, @Request() req) {
    const resena = await this.resenasService.buscarPorId(resena_id);
    if (!resena) {
      throw new Error('Reseña no encontrada');
    }

    // Solo el comprador o admin puede eliminar
    const puedeEliminar = req.user.usuario_id === resena.comprador_id ||
                         req.user.rol === 'admin' || 
                         req.user.rol === 'super_admin';

    if (!puedeEliminar) {
      throw new Error('No autorizado para eliminar esta reseña');
    }

    await this.resenasService.eliminarResena(resena_id);
    return { mensaje: 'Reseña eliminada correctamente' };
  }
} 