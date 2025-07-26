import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between } from 'typeorm';
import { Producto } from './producto.entity';
import { CrearProductoDto } from './dto/crear-producto.dto';
import { BuscarProductoDto } from './dto/buscar-producto.dto';
import { ImagenProducto } from './imagen-producto.entity';
import { CrearImagenDto } from './dto/crear-imagen.dto';

@Injectable()
export class ProductosService {
  constructor(
    @InjectRepository(Producto)
    private readonly productoRepositorio: Repository<Producto>,
    @InjectRepository(ImagenProducto)
    private readonly imagenRepositorio: Repository<ImagenProducto>,
  ) {}

  private generarSKU(nombre: string): string {
    const timestamp = Date.now().toString().slice(-6);
    const nombreCorto = nombre.substring(0, 3).toUpperCase().replace(/\s/g, '');
    return `${nombreCorto}${timestamp}`;
  }

  async crearProducto(datos: CrearProductoDto): Promise<Producto> {
    // Generar SKU automático si no se proporciona
    if (!datos.sku) {
      datos.sku = this.generarSKU(datos.nombre);
    } else {
      // Verificar que el SKU no exista
      const existente = await this.productoRepositorio.findOne({ where: { sku: datos.sku } });
      if (existente) {
        throw new BadRequestException('Ya existe un producto con ese SKU');
      }
    }

    const producto = this.productoRepositorio.create({
      ...datos,
      cantidad_stock: datos.cantidad_stock ?? 0,
      esta_activo: datos.esta_activo ?? true,
    });

    return this.productoRepositorio.save(producto);
  }

  async listarProductos(): Promise<Producto[]> {
    return this.productoRepositorio.find({
      relations: ['categoria', 'imagenes'],
      order: { creado_at: 'DESC' }
    });
  }

  async buscarProductos(filtros: BuscarProductoDto): Promise<{ productos: Producto[], total: number }> {
    const queryBuilder = this.productoRepositorio.createQueryBuilder('producto')
      .leftJoinAndSelect('producto.categoria', 'categoria')
      .leftJoinAndSelect('producto.imagenes', 'imagenes');

    if (filtros.nombre) {
      queryBuilder.andWhere('producto.nombre ILIKE :nombre', { nombre: `%${filtros.nombre}%` });
    }

    if (filtros.categoria_id) {
      queryBuilder.andWhere('producto.categoria_id = :categoria_id', { categoria_id: filtros.categoria_id });
    }

    if (filtros.precio_min !== undefined) {
      queryBuilder.andWhere('producto.precio_actual >= :precio_min', { precio_min: filtros.precio_min });
    }

    if (filtros.precio_max !== undefined) {
      queryBuilder.andWhere('producto.precio_actual <= :precio_max', { precio_max: filtros.precio_max });
    }

    if (filtros.esta_activo !== undefined) {
      queryBuilder.andWhere('producto.esta_activo = :esta_activo', { esta_activo: filtros.esta_activo });
    }

    const total = await queryBuilder.getCount();
    
    queryBuilder
      .orderBy('producto.creado_at', 'DESC')
      .skip(filtros.offset || 0)
      .take(filtros.limit || 20);

    const productos = await queryBuilder.getMany();

    return { productos, total };
  }

  async buscarPorId(producto_id: string): Promise<Producto | undefined> {
    const producto = await this.productoRepositorio.findOne({
      where: { producto_id },
      relations: ['categoria', 'imagenes']
    });
    return producto ?? undefined;
  }

  async actualizarProducto(producto_id: string, datos: Partial<CrearProductoDto>): Promise<Producto> {
    const producto = await this.buscarPorId(producto_id);
    if (!producto) {
      throw new NotFoundException('Producto no encontrado');
    }

    if (datos.sku && datos.sku !== producto.sku) {
      const existente = await this.productoRepositorio.findOne({ where: { sku: datos.sku } });
      if (existente) {
        throw new BadRequestException('Ya existe un producto con ese SKU');
      }
    }

    Object.assign(producto, datos);
    return this.productoRepositorio.save(producto);
  }

  async eliminarProducto(producto_id: string): Promise<void> {
    const producto = await this.buscarPorId(producto_id);
    if (!producto) {
      throw new NotFoundException('Producto no encontrado');
    }

    await this.productoRepositorio.remove(producto);
  }

  async actualizarStock(producto_id: string, cantidad: number): Promise<Producto> {
    const producto = await this.buscarPorId(producto_id);
    if (!producto) {
      throw new NotFoundException('Producto no encontrado');
    }

    producto.cantidad_stock = Math.max(0, producto.cantidad_stock + cantidad);
    return this.productoRepositorio.save(producto);
  }

  // Gestión de imágenes
  async agregarImagen(producto_id: string, datos: CrearImagenDto): Promise<ImagenProducto> {
    const producto = await this.buscarPorId(producto_id);
    if (!producto) {
      throw new NotFoundException('Producto no encontrado');
    }

    const imagen = this.imagenRepositorio.create({
      ...datos,
      producto_id,
      orden_indice: datos.orden_indice ?? 0
    });

    return this.imagenRepositorio.save(imagen);
  }

  async listarImagenes(producto_id: string): Promise<ImagenProducto[]> {
    return this.imagenRepositorio.find({
      where: { producto_id },
      order: { orden_indice: 'ASC', creado_at: 'ASC' }
    });
  }

  async eliminarImagen(imagen_id: string): Promise<void> {
    const imagen = await this.imagenRepositorio.findOne({ where: { imagen_id } });
    if (!imagen) {
      throw new NotFoundException('Imagen no encontrada');
    }

    await this.imagenRepositorio.remove(imagen);
  }
} 