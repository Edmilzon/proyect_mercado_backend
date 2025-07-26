import { Controller, Post, Body, Get, Put, Delete, Param, Query, UseGuards } from '@nestjs/common';
import { ProductosService } from './productos.service';
import { CrearProductoDto } from './dto/crear-producto.dto';
import { BuscarProductoDto } from './dto/buscar-producto.dto';
import { CrearImagenDto } from './dto/crear-imagen.dto';
import { JwtAuthGuard } from '../autenticacion/jwt-auth.guard';

@Controller('productos')
export class ProductosController {
  constructor(private readonly productosService: ProductosService) {}

  @Post()
  async crear(@Body() datos: CrearProductoDto) {
    const producto = await this.productosService.crearProducto(datos);
    return { mensaje: 'Producto creado correctamente', producto };
  }

  @Get()
  async listar() {
    const productos = await this.productosService.listarProductos();
    return { productos };
  }

  @Get('buscar')
  async buscar(@Query() filtros: BuscarProductoDto) {
    const resultado = await this.productosService.buscarProductos(filtros);
    return resultado;
  }

  @Get(':producto_id')
  async obtenerPorId(@Param('producto_id') producto_id: string) {
    const producto = await this.productosService.buscarPorId(producto_id);
    if (!producto) {
      return { mensaje: 'Producto no encontrado' };
    }
    return { producto };
  }

  @Put(':producto_id')
  async actualizar(@Param('producto_id') producto_id: string, @Body() datos: Partial<CrearProductoDto>) {
    const producto = await this.productosService.actualizarProducto(producto_id, datos);
    return { mensaje: 'Producto actualizado correctamente', producto };
  }

  @Delete(':producto_id')
  async eliminar(@Param('producto_id') producto_id: string) {
    await this.productosService.eliminarProducto(producto_id);
    return { mensaje: 'Producto eliminado correctamente' };
  }

  @Put(':producto_id/stock')
  async actualizarStock(@Param('producto_id') producto_id: string, @Body() datos: { cantidad: number }) {
    const producto = await this.productosService.actualizarStock(producto_id, datos.cantidad);
    return { mensaje: 'Stock actualizado correctamente', producto };
  }

  // Gestión de imágenes
  @Post(':producto_id/imagenes')
  async agregarImagen(@Param('producto_id') producto_id: string, @Body() datos: CrearImagenDto) {
    const imagen = await this.productosService.agregarImagen(producto_id, datos);
    return { mensaje: 'Imagen agregada correctamente', imagen };
  }

  @Get(':producto_id/imagenes')
  async listarImagenes(@Param('producto_id') producto_id: string) {
    const imagenes = await this.productosService.listarImagenes(producto_id);
    return { imagenes };
  }

  @Delete('imagenes/:imagen_id')
  async eliminarImagen(@Param('imagen_id') imagen_id: string) {
    await this.productosService.eliminarImagen(imagen_id);
    return { mensaje: 'Imagen eliminada correctamente' };
  }
} 