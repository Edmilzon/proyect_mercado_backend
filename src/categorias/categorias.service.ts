import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CategoriaProducto } from './categoria.entity';
import { CrearCategoriaDto } from './dto/crear-categoria.dto';

@Injectable()
export class CategoriasService {
  constructor(
    @InjectRepository(CategoriaProducto)
    private readonly categoriaRepositorio: Repository<CategoriaProducto>,
  ) {}

  async crearCategoria(datos: CrearCategoriaDto): Promise<CategoriaProducto> {
    const existente = await this.categoriaRepositorio.findOne({ where: { nombre: datos.nombre } });
    if (existente) {
      throw new BadRequestException('Ya existe una categoría con ese nombre');
    }

    if (datos.categoria_padre_id) {
      const categoriaPadre = await this.categoriaRepositorio.findOne({ 
        where: { categoria_id: datos.categoria_padre_id } 
      });
      if (!categoriaPadre) {
        throw new BadRequestException('La categoría padre no existe');
      }
    }

    const categoria = this.categoriaRepositorio.create(datos);
    return this.categoriaRepositorio.save(categoria);
  }

  async listarCategorias(): Promise<CategoriaProducto[]> {
    return this.categoriaRepositorio.find({
      relations: ['categoria_padre', 'subcategorias'],
      order: { nombre: 'ASC' }
    });
  }

  async listarCategoriasPadre(): Promise<CategoriaProducto[]> {
    return this.categoriaRepositorio.find({
      where: { categoria_padre_id: null as any },
      relations: ['subcategorias'],
      order: { nombre: 'ASC' }
    });
  }

  async buscarPorId(categoria_id: string): Promise<CategoriaProducto | undefined> {
    const categoria = await this.categoriaRepositorio.findOne({ 
      where: { categoria_id },
      relations: ['categoria_padre', 'subcategorias']
    });
    return categoria ?? undefined;
  }

  async actualizarCategoria(categoria_id: string, datos: Partial<CrearCategoriaDto>): Promise<CategoriaProducto> {
    const categoria = await this.buscarPorId(categoria_id);
    if (!categoria) {
      throw new NotFoundException('Categoría no encontrada');
    }

    if (datos.nombre && datos.nombre !== categoria.nombre) {
      const existente = await this.categoriaRepositorio.findOne({ where: { nombre: datos.nombre } });
      if (existente) {
        throw new BadRequestException('Ya existe una categoría con ese nombre');
      }
    }

    Object.assign(categoria, datos);
    return this.categoriaRepositorio.save(categoria);
  }

  async eliminarCategoria(categoria_id: string): Promise<void> {
    const categoria = await this.buscarPorId(categoria_id);
    if (!categoria) {
      throw new NotFoundException('Categoría no encontrada');
    }

    // Verificar si tiene subcategorías
    const subcategorias = await this.categoriaRepositorio.find({ 
      where: { categoria_padre_id: categoria_id } 
    });
    if (subcategorias.length > 0) {
      throw new BadRequestException('No se puede eliminar una categoría que tiene subcategorías');
    }

    await this.categoriaRepositorio.remove(categoria);
  }
} 