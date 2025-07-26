import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Pedido } from './pedido.entity';
import { ItemPedido } from './item-pedido.entity';
import { CrearPedidoDto, ItemPedidoDto } from './dto/crear-pedido.dto';
import { ActualizarEstadoDto } from './dto/actualizar-estado.dto';
import { Producto } from '../productos/producto.entity';
import { Usuario } from '../usuarios/usuario.entity';
import { DireccionUsuario } from '../usuarios/direccion.entity';

@Injectable()
export class PedidosService {
  constructor(
    @InjectRepository(Pedido)
    private readonly pedidoRepositorio: Repository<Pedido>,
    @InjectRepository(ItemPedido)
    private readonly itemRepositorio: Repository<ItemPedido>,
    @InjectRepository(Producto)
    private readonly productoRepositorio: Repository<Producto>,
    @InjectRepository(Usuario)
    private readonly usuarioRepositorio: Repository<Usuario>,
    @InjectRepository(DireccionUsuario)
    private readonly direccionRepositorio: Repository<DireccionUsuario>,
    private dataSource: DataSource,
  ) {}

  private generarCodigoQR(pedidoId: string): string {
    // Simulación de generación de código QR
    return `https://qr.ejemplo.com/pago/${pedidoId}`;
  }

  private async calcularTotales(items: ItemPedidoDto[]): Promise<{
    monto_total: number;
    items_con_precios: Array<ItemPedidoDto & { precio_en_compra: number; total_item_precio: number }>;
  }> {
    let monto_total = 0;
    const items_con_precios: Array<ItemPedidoDto & { precio_en_compra: number; total_item_precio: number }> = [];

    for (const item of items) {
      const producto = await this.productoRepositorio.findOne({ where: { producto_id: item.producto_id } });
      if (!producto) {
        throw new BadRequestException(`Producto ${item.producto_id} no encontrado`);
      }
      if (!producto.esta_activo) {
        throw new BadRequestException(`Producto ${producto.nombre} no está disponible`);
      }
      if (producto.cantidad_stock < item.cantidad) {
        throw new BadRequestException(`Stock insuficiente para ${producto.nombre}`);
      }

      const precio_en_compra = producto.precio_actual;
      const total_item_precio = precio_en_compra * item.cantidad;
      monto_total += total_item_precio;

      items_con_precios.push({
        ...item,
        precio_en_compra,
        total_item_precio,
      });
    }

    return { monto_total, items_con_precios };
  }

  async crearPedido(datos: CrearPedidoDto): Promise<Pedido> {
    // Validar que el comprador existe
    const comprador = await this.usuarioRepositorio.findOne({ where: { usuario_id: datos.comprador_id } });
    if (!comprador) {
      throw new BadRequestException('Comprador no encontrado');
    }

    // Validar que la dirección existe y pertenece al comprador
    const direccion = await this.direccionRepositorio.findOne({ 
      where: { direccion_id: datos.direccion_entrega_id, usuario_id: datos.comprador_id } 
    });
    if (!direccion) {
      throw new BadRequestException('Dirección no encontrada o no pertenece al comprador');
    }

    // Calcular totales y validar productos
    const { monto_total, items_con_precios } = await this.calcularTotales(datos.items);

    const monto_final = monto_total + (datos.costo_envio || 0) - (datos.monto_descuento || 0);

    // Usar transacción para crear pedido e items
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Crear pedido
      const pedido = this.pedidoRepositorio.create({
        comprador_id: datos.comprador_id,
        vendedor_id: datos.vendedor_id,
        direccion_entrega_id: datos.direccion_entrega_id,
        monto_total,
        costo_envio: datos.costo_envio || 0,
        monto_descuento: datos.monto_descuento || 0,
        monto_final,
        estado: 'pendiente',
        notas_comprador: datos.notas_comprador,
        whatsapp_pedido_id: datos.whatsapp_pedido_id,
        url_codigo_qr: this.generarCodigoQR('temp'), // Se actualizará después
      });

      const pedidoGuardado = await queryRunner.manager.save(pedido);

      // Actualizar URL del código QR con el ID real
      pedidoGuardado.url_codigo_qr = this.generarCodigoQR(pedidoGuardado.pedido_id);
      await queryRunner.manager.save(pedidoGuardado);

      // Crear items del pedido
      const items = items_con_precios.map(item => 
        this.itemRepositorio.create({
          pedido_id: pedidoGuardado.pedido_id,
          producto_id: item.producto_id,
          cantidad: item.cantidad,
          precio_en_compra: item.precio_en_compra,
          total_item_precio: item.total_item_precio,
        })
      );

      await queryRunner.manager.save(items);

      // Actualizar stock de productos
      for (const item of items_con_precios) {
        await queryRunner.manager
          .createQueryBuilder()
          .update(Producto)
          .set({ cantidad_stock: () => `cantidad_stock - ${item.cantidad}` })
          .where('producto_id = :producto_id', { producto_id: item.producto_id })
          .execute();
      }

      await queryRunner.commitTransaction();

      // Retornar pedido con items
      const pedidoCompleto = await this.buscarPorId(pedidoGuardado.pedido_id);
      if (!pedidoCompleto) {
        throw new Error('Error al recuperar el pedido creado');
      }
      return pedidoCompleto;

    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async listarPedidos(): Promise<Pedido[]> {
    return this.pedidoRepositorio.find({
      relations: ['comprador', 'vendedor', 'direccion_entrega', 'items', 'items.producto'],
      order: { fecha_pedido: 'DESC' }
    });
  }

  async buscarPorId(pedido_id: string): Promise<Pedido | undefined> {
    const pedido = await this.pedidoRepositorio.findOne({
      where: { pedido_id },
      relations: ['comprador', 'vendedor', 'direccion_entrega', 'items', 'items.producto', 'pagos']
    });
    return pedido ?? undefined;
  }

  async listarPorComprador(comprador_id: string): Promise<Pedido[]> {
    return this.pedidoRepositorio.find({
      where: { comprador_id },
      relations: ['vendedor', 'direccion_entrega', 'items', 'items.producto'],
      order: { fecha_pedido: 'DESC' }
    });
  }

  async listarPorVendedor(vendedor_id: string): Promise<Pedido[]> {
    return this.pedidoRepositorio.find({
      where: { vendedor_id },
      relations: ['comprador', 'direccion_entrega', 'items', 'items.producto'],
      order: { fecha_pedido: 'DESC' }
    });
  }

  async actualizarEstado(pedido_id: string, datos: ActualizarEstadoDto): Promise<Pedido> {
    const pedido = await this.buscarPorId(pedido_id);
    if (!pedido) {
      throw new NotFoundException('Pedido no encontrado');
    }

    // Validar transiciones de estado
    const estadosValidos = ['pendiente', 'confirmado', 'en_preparacion', 'en_ruta', 'entregado', 'cancelado', 'reembolsado'];
    if (!estadosValidos.includes(datos.estado)) {
      throw new BadRequestException('Estado no válido');
    }

    // Si se cancela o reembolsa, restaurar stock
    if ((datos.estado === 'cancelado' || datos.estado === 'reembolsado') && 
        pedido.estado !== 'cancelado' && pedido.estado !== 'reembolsado') {
      await this.restaurarStock(pedido_id);
    }

    Object.assign(pedido, datos);
    return this.pedidoRepositorio.save(pedido);
  }

  private async restaurarStock(pedido_id: string): Promise<void> {
    const items = await this.itemRepositorio.find({ where: { pedido_id } });
    
    for (const item of items) {
      await this.productoRepositorio
        .createQueryBuilder()
        .update(Producto)
        .set({ cantidad_stock: () => `cantidad_stock + ${item.cantidad}` })
        .where('producto_id = :producto_id', { producto_id: item.producto_id })
        .execute();
    }
  }

  async eliminarPedido(pedido_id: string): Promise<void> {
    const pedido = await this.buscarPorId(pedido_id);
    if (!pedido) {
      throw new NotFoundException('Pedido no encontrado');
    }

    if (pedido.estado !== 'pendiente') {
      throw new BadRequestException('Solo se pueden eliminar pedidos pendientes');
    }

    await this.pedidoRepositorio.remove(pedido);
  }
} 