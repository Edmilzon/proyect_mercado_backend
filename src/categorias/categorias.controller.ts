import { Controller, Post, Body, Get, Put, Delete, Param, UseGuards } from '@nestjs/common';
import { CategoriasService } from './categorias.service';
import { CrearCategoriaDto } from './dto/crear-categoria.dto';
import { JwtAuthGuard } from '../autenticacion/jwt-auth.guard';

@Controller('categorias')
export class CategoriasController {
  constructor(private readonly categoriasService: CategoriasService) {}

  @Post()
  async crear(@Body() datos: CrearCategoriaDto) {
    const categoria = await this.categoriasService.crearCategoria(datos);
    return { mensaje: 'Categoría creada correctamente', categoria };
  }

  @Get()
  async listar() {
    const categorias = await this.categoriasService.listarCategorias();
    return { categorias };
  }

  @Get('padres')
  async listarPadres() {
    const categorias = await this.categoriasService.listarCategoriasPadre();
    return { categorias };
  }

  @Get(':categoria_id')
  async obtenerPorId(@Param('categoria_id') categoria_id: string) {
    const categoria = await this.categoriasService.buscarPorId(categoria_id);
    if (!categoria) {
      return { mensaje: 'Categoría no encontrada' };
    }
    return { categoria };
  }

  @Put(':categoria_id')
  async actualizar(@Param('categoria_id') categoria_id: string, @Body() datos: Partial<CrearCategoriaDto>) {
    const categoria = await this.categoriasService.actualizarCategoria(categoria_id, datos);
    return { mensaje: 'Categoría actualizada correctamente', categoria };
  }

  @Delete(':categoria_id')
  async eliminar(@Param('categoria_id') categoria_id: string) {
    await this.categoriasService.eliminarCategoria(categoria_id);
    return { mensaje: 'Categoría eliminada correctamente' };
  }
} 