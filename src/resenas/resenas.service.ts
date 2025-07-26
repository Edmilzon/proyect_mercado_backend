import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Resena } from './resena.entity';
import { CrearResenaDto } from './dto/crear-resena.dto';
import { BuscarResenaDto } from './dto/buscar-resena.dto';
import { Pedido } from '../pedidos/pedido.entity';
import { Usuario } from '../usuarios/usuario.entity';
import { Vendedor } from '../vendedores/vendedor.entity';

@Injectable()
export class ResenasService {
  constructor(
    @InjectRepository(Resena)
    private readonly resenaRepositorio: Repository<Resena>,
    @InjectRepository(Pedido)
    private readonly pedidoRepositorio: Repository<Pedido>,
    @InjectRepository(Usuario)
    private readonly usuarioRepositorio: Repository<Usuario>,
    @InjectRepository(Vendedor)
    private readonly vendedorRepositorio: Repository<Vendedor>,
    private dataSource: DataSource,
  ) {}

  async crearResena(datos: CrearResenaDto): Promise<Resena> {
    // Validar que el pedido existe y está entregado
    const pedido = await this.pedidoRepositorio.findOne({ where: { pedido_id: datos.pedido_id } });
    if (!pedido) {
      throw new BadRequestException('Pedido no encontrado');
    }
    if (pedido.estado !== 'entregado') {
      throw new BadRequestException('Solo se pueden calificar pedidos entregados');
    }

    // Validar que el comprador existe
    const comprador = await this.usuarioRepositorio.findOne({ where: { usuario_id: datos.comprador_id } });
    if (!comprador) {
      throw new BadRequestException('Comprador no encontrado');
    }

    // Validar que el vendedor existe
    const vendedor = await this.vendedorRepositorio.findOne({ where: { vendedor_id: datos.vendedor_id } });
    if (!vendedor) {
      throw new BadRequestException('Vendedor no encontrado');
    }

    // Validar que el pedido pertenece al comprador y vendedor
    if (pedido.comprador_id !== datos.comprador_id || pedido.vendedor_id !== datos.vendedor_id) {
      throw new BadRequestException('Datos del pedido no coinciden');
    }

    // Verificar que no exista ya una reseña para este pedido
    const resenaExistente = await this.resenaRepositorio.findOne({ where: { pedido_id: datos.pedido_id } });
    if (resenaExistente) {
      throw new BadRequestException('Ya existe una reseña para este pedido');
    }

    // Usar transacción para crear reseña y actualizar calificación del vendedor
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Crear reseña
      const resena = this.resenaRepositorio.create(datos);
      const resenaGuardada = await queryRunner.manager.save(resena);

      // Actualizar calificación promedio del vendedor
      await this.actualizarCalificacionVendedor(queryRunner, datos.vendedor_id);

      await queryRunner.commitTransaction();
      return resenaGuardada;

    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private async actualizarCalificacionVendedor(queryRunner: any, vendedor_id: string): Promise<void> {
    // Calcular nueva calificación promedio
    const resultado = await queryRunner.manager
      .createQueryBuilder(Resena, 'resena')
      .select('AVG(resena.calificacion)', 'promedio')
      .addSelect('COUNT(resena.resena_id)', 'total')
      .where('resena.vendedor_id = :vendedor_id', { vendedor_id })
      .getRawOne();

    const calificacionPromedio = parseFloat(resultado.promedio) || 0;
    const totalResenas = parseInt(resultado.total) || 0;

    // Actualizar vendedor
    await queryRunner.manager
      .createQueryBuilder()
      .update(Vendedor)
      .set({ 
        calificacion_promedio: calificacionPromedio,
        total_resenas: totalResenas
      })
      .where('vendedor_id = :vendedor_id', { vendedor_id })
      .execute();
  }

  async listarResenas(): Promise<Resena[]> {
    return this.resenaRepositorio.find({
      relations: ['pedido', 'comprador', 'vendedor'],
      order: { fecha_resena: 'DESC' }
    });
  }

  async buscarResenas(filtros: BuscarResenaDto): Promise<{ resenas: Resena[], total: number }> {
    const queryBuilder = this.resenaRepositorio.createQueryBuilder('resena')
      .leftJoinAndSelect('resena.pedido', 'pedido')
      .leftJoinAndSelect('resena.comprador', 'comprador')
      .leftJoinAndSelect('resena.vendedor', 'vendedor');

    if (filtros.vendedor_id) {
      queryBuilder.andWhere('resena.vendedor_id = :vendedor_id', { vendedor_id: filtros.vendedor_id });
    }

    if (filtros.comprador_id) {
      queryBuilder.andWhere('resena.comprador_id = :comprador_id', { comprador_id: filtros.comprador_id });
    }

    if (filtros.calificacion) {
      queryBuilder.andWhere('resena.calificacion = :calificacion', { calificacion: filtros.calificacion });
    }

    const total = await queryBuilder.getCount();
    
    queryBuilder
      .orderBy('resena.fecha_resena', 'DESC')
      .skip(filtros.offset || 0)
      .take(filtros.limit || 20);

    const resenas = await queryBuilder.getMany();

    return { resenas, total };
  }

  async buscarPorId(resena_id: string): Promise<Resena | undefined> {
    const resena = await this.resenaRepositorio.findOne({
      where: { resena_id },
      relations: ['pedido', 'comprador', 'vendedor']
    });
    return resena ?? undefined;
  }

  async listarPorVendedor(vendedor_id: string): Promise<Resena[]> {
    return this.resenaRepositorio.find({
      where: { vendedor_id },
      relations: ['pedido', 'comprador'],
      order: { fecha_resena: 'DESC' }
    });
  }

  async listarPorComprador(comprador_id: string): Promise<Resena[]> {
    return this.resenaRepositorio.find({
      where: { comprador_id },
      relations: ['pedido', 'vendedor'],
      order: { fecha_resena: 'DESC' }
    });
  }

  async listarPendientes(comprador_id: string): Promise<Pedido[]> {
    // Buscar pedidos entregados sin reseña
    return this.pedidoRepositorio
      .createQueryBuilder('pedido')
      .leftJoin('resenas', 'resena', 'resena.pedido_id = pedido.pedido_id')
      .where('pedido.comprador_id = :comprador_id', { comprador_id })
      .andWhere('pedido.estado = :estado', { estado: 'entregado' })
      .andWhere('resena.resena_id IS NULL')
      .orderBy('pedido.fecha_pedido', 'DESC')
      .getMany();
  }

  async responderResena(resena_id: string, respuesta: string): Promise<Resena> {
    const resena = await this.buscarPorId(resena_id);
    if (!resena) {
      throw new NotFoundException('Reseña no encontrada');
    }

    resena.respuesta_vendedor = respuesta;
    resena.fecha_respuesta = new Date();

    return this.resenaRepositorio.save(resena);
  }

  async obtenerCalificacionVendedor(vendedor_id: string): Promise<{
    calificacion_promedio: number;
    total_resenas: number;
    distribucion: { [key: number]: number };
  }> {
    const vendedor = await this.vendedorRepositorio.findOne({ where: { vendedor_id } });
    if (!vendedor) {
      throw new NotFoundException('Vendedor no encontrado');
    }

    // Obtener distribución de calificaciones
    const distribucion = await this.resenaRepositorio
      .createQueryBuilder('resena')
      .select('resena.calificacion', 'calificacion')
      .addSelect('COUNT(*)', 'cantidad')
      .where('resena.vendedor_id = :vendedor_id', { vendedor_id })
      .groupBy('resena.calificacion')
      .getRawMany();

    const distribucionMap = {};
    for (let i = 1; i <= 5; i++) {
      distribucionMap[i] = 0;
    }

    distribucion.forEach(item => {
      distribucionMap[item.calificacion] = parseInt(item.cantidad);
    });

    return {
      calificacion_promedio: vendedor.calificacion_promedio,
      total_resenas: vendedor.total_resenas,
      distribucion: distribucionMap,
    };
  }

  async actualizarResena(resena_id: string, datos: Partial<CrearResenaDto>): Promise<Resena> {
    const resena = await this.buscarPorId(resena_id);
    if (!resena) {
      throw new NotFoundException('Reseña no encontrada');
    }

    // Solo permitir actualizar calificación y comentario
    if (datos.calificacion !== undefined) {
      resena.calificacion = datos.calificacion;
    }
    if (datos.comentario !== undefined) {
      resena.comentario = datos.comentario;
    }

    const resenaActualizada = await this.resenaRepositorio.save(resena);

    // Actualizar calificación promedio del vendedor
    await this.actualizarCalificacionVendedor(this.dataSource.createQueryRunner(), resena.vendedor_id);

    return resenaActualizada;
  }

  async eliminarResena(resena_id: string): Promise<void> {
    const resena = await this.buscarPorId(resena_id);
    if (!resena) {
      throw new NotFoundException('Reseña no encontrada');
    }

    await this.resenaRepositorio.remove(resena);

    // Actualizar calificación promedio del vendedor
    await this.actualizarCalificacionVendedor(this.dataSource.createQueryRunner(), resena.vendedor_id);
  }
} 