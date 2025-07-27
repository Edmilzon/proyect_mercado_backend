import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Usuario } from '../usuarios/usuario.entity';
import { Producto } from '../productos/producto.entity';
import { Pedido } from '../pedidos/pedido.entity';
import { Favorito } from '../vendedores/favorito.entity';
import { Notificacion } from '../vendedores/notificacion.entity';
import { CodigoDescuento } from '../vendedores/codigo-descuento.entity';
import { CrearFavoritoDto } from '../vendedores/dto/crear-favorito.dto';

@Injectable()
export class CompradoresService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepositorio: Repository<Usuario>,
    @InjectRepository(Producto)
    private readonly productoRepositorio: Repository<Producto>,
    @InjectRepository(Pedido)
    private readonly pedidoRepositorio: Repository<Pedido>,
    @InjectRepository(Favorito)
    private readonly favoritoRepositorio: Repository<Favorito>,
    @InjectRepository(Notificacion)
    private readonly notificacionRepositorio: Repository<Notificacion>,
    @InjectRepository(CodigoDescuento)
    private readonly codigoDescuentoRepositorio: Repository<CodigoDescuento>,
  ) {}

  // ===== HISTORIAL DE COMPRAS =====
  async obtenerHistorialCompras(usuario_id: string, filtros?: {
    estado?: string;
    fecha_desde?: Date;
    fecha_hasta?: Date;
    limit?: number;
    offset?: number;
  }): Promise<{ pedidos: Pedido[], total: number }> {
    const queryBuilder = this.pedidoRepositorio.createQueryBuilder('pedido')
      .leftJoinAndSelect('pedido.vendedor', 'vendedor')
      .leftJoinAndSelect('pedido.items', 'items')
      .leftJoinAndSelect('items.producto', 'producto')
      .leftJoinAndSelect('pedido.direccion_entrega', 'direccion')
      .where('pedido.comprador_id = :usuario_id', { usuario_id });

    if (filtros?.estado) {
      queryBuilder.andWhere('pedido.estado = :estado', { estado: filtros.estado });
    }

    if (filtros?.fecha_desde) {
      queryBuilder.andWhere('pedido.fecha_pedido >= :fecha_desde', { fecha_desde: filtros.fecha_desde });
    }

    if (filtros?.fecha_hasta) {
      queryBuilder.andWhere('pedido.fecha_pedido <= :fecha_hasta', { fecha_hasta: filtros.fecha_hasta });
    }

    const total = await queryBuilder.getCount();

    queryBuilder
      .orderBy('pedido.fecha_pedido', 'DESC')
      .skip(filtros?.offset || 0)
      .take(filtros?.limit || 20);

    const pedidos = await queryBuilder.getMany();

    return { pedidos, total };
  }

  // ===== FAVORITOS =====
  async agregarFavorito(datos: CrearFavoritoDto): Promise<Favorito> {
    // Verificar que el producto existe
    const producto = await this.productoRepositorio.findOne({ where: { producto_id: datos.producto_id } });
    if (!producto) {
      throw new BadRequestException('Producto no encontrado');
    }

    // Verificar que no esté ya en favoritos
    const existe = await this.favoritoRepositorio.findOne({ 
      where: { usuario_id: datos.usuario_id, producto_id: datos.producto_id } 
    });
    if (existe) {
      throw new BadRequestException('El producto ya está en favoritos');
    }

    const favorito = this.favoritoRepositorio.create(datos);
    return this.favoritoRepositorio.save(favorito);
  }

  async listarFavoritos(usuario_id: string): Promise<Favorito[]> {
    return this.favoritoRepositorio.find({
      where: { usuario_id },
      relations: ['producto', 'producto.vendedor', 'producto.categoria'],
      order: { creado_at: 'DESC' }
    });
  }

  async eliminarFavorito(usuario_id: string, producto_id: string): Promise<void> {
    const favorito = await this.favoritoRepositorio.findOne({ 
      where: { usuario_id, producto_id } 
    });
    if (!favorito) {
      throw new BadRequestException('Favorito no encontrado');
    }

    await this.favoritoRepositorio.remove(favorito);
  }

  async verificarFavorito(usuario_id: string, producto_id: string): Promise<boolean> {
    const favorito = await this.favoritoRepositorio.findOne({ 
      where: { usuario_id, producto_id } 
    });
    return !!favorito;
  }

  // ===== NOTIFICACIONES =====
  async listarNotificaciones(usuario_id: string, filtros?: {
    es_leida?: boolean;
    tipo?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ notificaciones: Notificacion[], total: number }> {
    const queryBuilder = this.notificacionRepositorio.createQueryBuilder('notificacion')
      .where('notificacion.usuario_id = :usuario_id', { usuario_id });

    if (filtros?.es_leida !== undefined) {
      queryBuilder.andWhere('notificacion.es_leida = :es_leida', { es_leida: filtros.es_leida });
    }

    if (filtros?.tipo) {
      queryBuilder.andWhere('notificacion.tipo = :tipo', { tipo: filtros.tipo });
    }

    const total = await queryBuilder.getCount();

    queryBuilder
      .orderBy('notificacion.creado_at', 'DESC')
      .skip(filtros?.offset || 0)
      .take(filtros?.limit || 20);

    const notificaciones = await queryBuilder.getMany();

    return { notificaciones, total };
  }

  async marcarNotificacionComoLeida(notificacion_id: string, usuario_id: string): Promise<Notificacion> {
    const notificacion = await this.notificacionRepositorio.findOne({ 
      where: { notificacion_id, usuario_id } 
    });
    if (!notificacion) {
      throw new BadRequestException('Notificación no encontrada');
    }

    notificacion.es_leida = true;
    return this.notificacionRepositorio.save(notificacion);
  }

  async marcarTodasComoLeidas(usuario_id: string): Promise<void> {
    await this.notificacionRepositorio.update(
      { usuario_id, es_leida: false },
      { es_leida: true }
    );
  }

  async obtenerContadorNotificacionesNoLeidas(usuario_id: string): Promise<number> {
    return this.notificacionRepositorio.count({ 
      where: { usuario_id, es_leida: false } 
    });
  }

  // ===== CÓDIGOS DE DESCUENTO =====
  async validarCodigoDescuento(codigo: string, monto_subtotal: number, categoria_id?: string): Promise<CodigoDescuento | null> {
    const codigoDescuento = await this.codigoDescuentoRepositorio.findOne({ 
      where: { codigo, esta_activo: true } 
    });

    if (!codigoDescuento) {
      return null;
    }

    // Verificar fecha de validez
    const ahora = new Date();
    if (codigoDescuento.fecha_inicio && ahora < codigoDescuento.fecha_inicio) {
      return null;
    }
    if (codigoDescuento.fecha_fin && ahora > codigoDescuento.fecha_fin) {
      return null;
    }

    // Verificar monto mínimo
    if (codigoDescuento.monto_minimo && monto_subtotal < codigoDescuento.monto_minimo) {
      return null;
    }

    // Verificar usos máximos
    if (codigoDescuento.usos_maximos && codigoDescuento.usos_actuales >= codigoDescuento.usos_maximos) {
      return null;
    }

    // Verificar categoría específica
    if (codigoDescuento.categoria_id && categoria_id && codigoDescuento.categoria_id !== categoria_id) {
      return null;
    }

    return codigoDescuento;
  }

  async aplicarCodigoDescuento(codigo_id: string): Promise<void> {
    const codigo = await this.codigoDescuentoRepositorio.findOne({ where: { codigo_id } });
    if (!codigo) {
      throw new BadRequestException('Código de descuento no encontrado');
    }

    codigo.usos_actuales += 1;
    await this.codigoDescuentoRepositorio.save(codigo);
  }

  // ===== SEGUIMIENTO DE PEDIDOS =====
  async obtenerSeguimientoPedido(pedido_id: string, usuario_id: string): Promise<any> {
    const pedido = await this.pedidoRepositorio.findOne({
      where: { pedido_id, comprador_id: usuario_id },
      relations: ['vendedor', 'items', 'items.producto', 'direccion_entrega']
    });

    if (!pedido) {
      throw new BadRequestException('Pedido no encontrado');
    }

    // Calcular tiempo estimado de entrega
    const tiempoEstimado = this.calcularTiempoEstimado(pedido.estado, pedido.hora_estimada_entrega);

    return {
      pedido,
      tiempo_estimado: tiempoEstimado,
      estado_detallado: this.obtenerEstadoDetallado(pedido.estado)
    };
  }

  private calcularTiempoEstimado(estado: string, horaEstimada?: Date): string {
    if (estado === 'entregado') {
      return 'Entregado';
    }

    if (horaEstimada) {
      const ahora = new Date();
      const diferencia = horaEstimada.getTime() - ahora.getTime();
      const minutos = Math.floor(diferencia / (1000 * 60));
      
      if (minutos <= 0) {
        return 'En camino';
      } else if (minutos < 60) {
        return `${minutos} minutos`;
      } else {
        const horas = Math.floor(minutos / 60);
        return `${horas} horas`;
      }
    }

    switch (estado) {
      case 'pendiente': return '15-30 minutos';
      case 'confirmado': return '10-20 minutos';
      case 'en_preparacion': return '5-15 minutos';
      case 'en_ruta': return 'En camino';
      default: return 'Tiempo estimado no disponible';
    }
  }

  private obtenerEstadoDetallado(estado: string): string {
    switch (estado) {
      case 'pendiente': return 'Pedido recibido, esperando confirmación del vendedor';
      case 'confirmado': return 'Pedido confirmado, en preparación';
      case 'en_preparacion': return 'Productos siendo preparados';
      case 'en_ruta': return 'Pedido en camino hacia tu dirección';
      case 'entregado': return 'Pedido entregado exitosamente';
      case 'cancelado': return 'Pedido cancelado';
      case 'reembolsado': return 'Pedido reembolsado';
      default: return 'Estado desconocido';
    }
  }

  // ===== ESTADÍSTICAS DEL COMPRADOR =====
  async obtenerEstadisticasComprador(usuario_id: string): Promise<any> {
    const [
      totalPedidos,
      pedidosEntregados,
      totalGastado,
      productosFavoritos,
      notificacionesNoLeidas
    ] = await Promise.all([
      this.pedidoRepositorio.count({ where: { comprador_id: usuario_id } }),
      this.pedidoRepositorio.count({ where: { comprador_id: usuario_id, estado: 'entregado' } }),
      this.pedidoRepositorio
        .createQueryBuilder('pedido')
        .select('SUM(pedido.monto_final)', 'total')
        .where('pedido.comprador_id = :usuario_id', { usuario_id })
        .andWhere('pedido.estado = :estado', { estado: 'entregado' })
        .getRawOne(),
      this.favoritoRepositorio.count({ where: { usuario_id } }),
      this.notificacionRepositorio.count({ where: { usuario_id, es_leida: false } })
    ]);

    return {
      total_pedidos: totalPedidos,
      pedidos_entregados: pedidosEntregados,
      total_gastado: parseFloat(totalGastado?.total || '0'),
      productos_favoritos: productosFavoritos,
      notificaciones_no_leidas: notificacionesNoLeidas
    };
  }
} 