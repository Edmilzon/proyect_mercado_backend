import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, IsNull } from 'typeorm';
import { Vendedor } from './vendedor.entity';
import { CrearVendedorDto } from './dto/crear-vendedor.dto';
import { ConvertirVendedorDto } from './dto/convertir-vendedor.dto';
import { DashboardVendedorDto } from './dto/dashboard-vendedor.dto';
import { UbicacionVendedor } from './ubicacion-vendedor.entity';
import { CrearUbicacionDto } from './dto/crear-ubicacion.dto';
import { Usuario } from '../usuarios/usuario.entity';
import { Producto } from '../productos/producto.entity';
import { Pedido } from '../pedidos/pedido.entity';
import { Resena } from '../resenas/resena.entity';
import { Conversacion } from '../chat/conversacion.entity';
import { Mensaje } from '../chat/mensaje.entity';

@Injectable()
export class VendedoresService {
  constructor(
    @InjectRepository(Vendedor)
    private readonly vendedorRepositorio: Repository<Vendedor>,
    @InjectRepository(UbicacionVendedor)
    private readonly ubicacionRepositorio: Repository<UbicacionVendedor>,
    @InjectRepository(Usuario)
    private readonly usuarioRepositorio: Repository<Usuario>,
    @InjectRepository(Producto)
    private readonly productoRepositorio: Repository<Producto>,
    @InjectRepository(Pedido)
    private readonly pedidoRepositorio: Repository<Pedido>,
    @InjectRepository(Resena)
    private readonly resenaRepositorio: Repository<Resena>,
    @InjectRepository(Conversacion)
    private readonly conversacionRepositorio: Repository<Conversacion>,
    @InjectRepository(Mensaje)
    private readonly mensajeRepositorio: Repository<Mensaje>,
  ) {}

  async obtenerDashboard(vendedor_id: string): Promise<DashboardVendedorDto> {
    // Validar que el vendedor existe
    const vendedor = await this.vendedorRepositorio.findOne({ where: { vendedor_id } });
    if (!vendedor) {
      throw new BadRequestException('Vendedor no encontrado');
    }

    // Estadísticas de productos
    const [totalProductos, productosActivos, productosSinStock] = await Promise.all([
      this.productoRepositorio.count({ where: { vendedor_id } }),
      this.productoRepositorio.count({ where: { vendedor_id, esta_activo: true } }),
      this.productoRepositorio.count({ where: { vendedor_id, cantidad_stock: 0 } }),
    ]);

    // Estadísticas de pedidos
    const [
      totalPedidos,
      pedidosPendientes,
      pedidosConfirmados,
      pedidosEnPreparacion,
      pedidosEnRuta,
      pedidosEntregados,
      pedidosCancelados
    ] = await Promise.all([
      this.pedidoRepositorio.count({ where: { vendedor_id } }),
      this.pedidoRepositorio.count({ where: { vendedor_id, estado: 'pendiente' } }),
      this.pedidoRepositorio.count({ where: { vendedor_id, estado: 'confirmado' } }),
      this.pedidoRepositorio.count({ where: { vendedor_id, estado: 'en_preparacion' } }),
      this.pedidoRepositorio.count({ where: { vendedor_id, estado: 'en_ruta' } }),
      this.pedidoRepositorio.count({ where: { vendedor_id, estado: 'entregado' } }),
      this.pedidoRepositorio.count({ where: { vendedor_id, estado: 'cancelado' } }),
    ]);

    // Estadísticas de reseñas
    const [totalResenas, resenasPendientes] = await Promise.all([
      this.resenaRepositorio.count({ where: { vendedor_id } }),
      this.resenaRepositorio.count({ where: { vendedor_id, respuesta_vendedor: IsNull() } }),
    ]);

    // Ventas por período
    const hoy = new Date();
    const inicioSemana = new Date(hoy.getTime() - 7 * 24 * 60 * 60 * 1000);
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

    const [ventasHoy, ventasSemana, ventasMes] = await Promise.all([
      this.pedidoRepositorio
        .createQueryBuilder('pedido')
        .select('SUM(pedido.monto_final)', 'total')
        .where('pedido.vendedor_id = :vendedor_id', { vendedor_id })
        .andWhere('pedido.estado = :estado', { estado: 'entregado' })
        .andWhere('DATE(pedido.fecha_pedido) = DATE(:hoy)', { hoy })
        .getRawOne(),
      this.pedidoRepositorio
        .createQueryBuilder('pedido')
        .select('SUM(pedido.monto_final)', 'total')
        .where('pedido.vendedor_id = :vendedor_id', { vendedor_id })
        .andWhere('pedido.estado = :estado', { estado: 'entregado' })
        .andWhere('pedido.fecha_pedido >= :inicioSemana', { inicioSemana })
        .getRawOne(),
      this.pedidoRepositorio
        .createQueryBuilder('pedido')
        .select('SUM(pedido.monto_final)', 'total')
        .where('pedido.vendedor_id = :vendedor_id', { vendedor_id })
        .andWhere('pedido.estado = :estado', { estado: 'entregado' })
        .andWhere('pedido.fecha_pedido >= :inicioMes', { inicioMes })
        .getRawOne(),
    ]);

    // Mensajes no leídos y conversaciones activas
    const [mensajesNoLeidos, conversacionesActivas] = await Promise.all([
      this.mensajeRepositorio
        .createQueryBuilder('mensaje')
        .innerJoin('mensaje.conversacion', 'conversacion')
        .innerJoin('conversacion.participantes', 'participante')
        .where('participante.usuario_id = :vendedor_id', { vendedor_id })
        .andWhere('mensaje.es_leido = :es_leido', { es_leido: false })
        .andWhere('mensaje.remitente_id != :vendedor_id', { vendedor_id })
        .getCount(),
      this.conversacionRepositorio
        .createQueryBuilder('conversacion')
        .innerJoin('conversacion.participantes', 'participante')
        .where('participante.usuario_id = :vendedor_id', { vendedor_id })
        .andWhere('conversacion.estado = :estado', { estado: 'activa' })
        .getCount(),
    ]);

    return {
      total_productos: totalProductos,
      productos_activos: productosActivos,
      productos_sin_stock: productosSinStock,
      total_pedidos: totalPedidos,
      pedidos_pendientes: pedidosPendientes,
      pedidos_confirmados: pedidosConfirmados,
      pedidos_en_preparacion: pedidosEnPreparacion,
      pedidos_en_ruta: pedidosEnRuta,
      pedidos_entregados: pedidosEntregados,
      pedidos_cancelados: pedidosCancelados,
      calificacion_promedio: vendedor.calificacion_promedio,
      total_resenas: totalResenas,
      resenas_pendientes: resenasPendientes,
      ventas_hoy: parseFloat(ventasHoy?.total || '0'),
      ventas_semana: parseFloat(ventasSemana?.total || '0'),
      ventas_mes: parseFloat(ventasMes?.total || '0'),
      mensajes_no_leidos: mensajesNoLeidos,
      conversaciones_activas: conversacionesActivas,
    };
  }

  async listarProductosDelVendedor(vendedor_id: string, filtros?: {
    esta_activo?: boolean;
    categoria_id?: string;
    nombre?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ productos: Producto[], total: number }> {
    const queryBuilder = this.productoRepositorio.createQueryBuilder('producto')
      .leftJoinAndSelect('producto.categoria', 'categoria')
      .leftJoinAndSelect('producto.imagenes', 'imagenes')
      .where('producto.vendedor_id = :vendedor_id', { vendedor_id });

    if (filtros?.esta_activo !== undefined) {
      queryBuilder.andWhere('producto.esta_activo = :esta_activo', { esta_activo: filtros.esta_activo });
    }

    if (filtros?.categoria_id) {
      queryBuilder.andWhere('producto.categoria_id = :categoria_id', { categoria_id: filtros.categoria_id });
    }

    if (filtros?.nombre) {
      queryBuilder.andWhere('producto.nombre ILIKE :nombre', { nombre: `%${filtros.nombre}%` });
    }

    const total = await queryBuilder.getCount();

    queryBuilder
      .orderBy('producto.creado_at', 'DESC')
      .skip(filtros?.offset || 0)
      .take(filtros?.limit || 20);

    const productos = await queryBuilder.getMany();

    return { productos, total };
  }

  async listarPedidosDelVendedor(vendedor_id: string, filtros?: {
    estado?: string;
    fecha_desde?: Date;
    fecha_hasta?: Date;
    limit?: number;
    offset?: number;
  }): Promise<{ pedidos: Pedido[], total: number }> {
    const queryBuilder = this.pedidoRepositorio.createQueryBuilder('pedido')
      .leftJoinAndSelect('pedido.comprador', 'comprador')
      .leftJoinAndSelect('pedido.items', 'items')
      .leftJoinAndSelect('items.producto', 'producto')
      .leftJoinAndSelect('pedido.direccion_entrega', 'direccion')
      .where('pedido.vendedor_id = :vendedor_id', { vendedor_id });

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

  async obtenerChatDelPedido(pedido_id: string, vendedor_id: string): Promise<Conversacion> {
    const conversacion = await this.conversacionRepositorio.findOne({
      where: { pedido_id },
      relations: ['participantes', 'participantes.usuario', 'mensajes', 'mensajes.remitente'],
    });

    if (!conversacion) {
      throw new BadRequestException('No se encontró conversación para este pedido');
    }

    // Verificar que el vendedor es participante
    const esParticipante = conversacion.participantes.some(p => p.usuario_id === vendedor_id);
    if (!esParticipante) {
      throw new BadRequestException('No tienes acceso a esta conversación');
    }

    return conversacion;
  }

  async convertirUsuarioEnVendedor(datos: ConvertirVendedorDto): Promise<{ vendedor: Vendedor; usuario: Usuario }> {
    // Validar que el usuario existe
    const usuario = await this.usuarioRepositorio.findOne({ where: { usuario_id: datos.usuario_id } });
    if (!usuario) {
      throw new BadRequestException('El usuario no existe');
    }

    // Validar que no exista ya un registro de vendedor para este usuario
    const existeVendedor = await this.vendedorRepositorio.findOne({ where: { vendedor_id: datos.usuario_id } });
    if (existeVendedor) {
      throw new BadRequestException('Este usuario ya es vendedor');
    }

    // Validar que el número de identificación no esté en uso
    const existeIdentificacion = await this.vendedorRepositorio.findOne({ 
      where: { numero_identificacion: datos.numero_identificacion } 
    });
    if (existeIdentificacion) {
      throw new BadRequestException('El número de identificación ya está en uso');
    }

    // Actualizar el rol del usuario a 'vendedor'
    usuario.rol = 'vendedor';
    await this.usuarioRepositorio.save(usuario);

    // Crear el registro de vendedor
    const vendedor = this.vendedorRepositorio.create({
      vendedor_id: datos.usuario_id,
      numero_identificacion: datos.numero_identificacion,
      estado_onboarding: datos.estado_onboarding || 'pendiente',
      zona_asignada_id: datos.zona_asignada_id,
    });

    const vendedorGuardado = await this.vendedorRepositorio.save(vendedor);

    return {
      vendedor: vendedorGuardado,
      usuario: usuario
    };
  }

  async crearVendedor(datos: CrearVendedorDto): Promise<Vendedor> {
    // Validar que el usuario existe y tiene rol vendedor
    const usuario = await this.usuarioRepositorio.findOne({ where: { usuario_id: datos.vendedor_id } });
    if (!usuario) {
      throw new BadRequestException('El usuario no existe');
    }
    if (usuario.rol !== 'vendedor') {
      throw new BadRequestException('El usuario no tiene rol vendedor');
    }
    // Validar que no exista ya un registro de vendedor para este usuario
    const existe = await this.vendedorRepositorio.findOne({ where: { vendedor_id: datos.vendedor_id } });
    if (existe) {
      throw new BadRequestException('Ya existe un registro de vendedor para este usuario');
    }
    const vendedor = this.vendedorRepositorio.create(datos);
    return this.vendedorRepositorio.save(vendedor);
  }

  async listarVendedores(): Promise<Vendedor[]> {
    return this.vendedorRepositorio.find({
      relations: ['usuario']
    });
  }

  async obtenerVendedorPorId(vendedor_id: string): Promise<Vendedor> {
    const vendedor = await this.vendedorRepositorio.findOne({ 
      where: { vendedor_id },
      relations: ['usuario']
    });
    if (!vendedor) {
      throw new BadRequestException('Vendedor no encontrado');
    }
    return vendedor;
  }

  async crearUbicacion(datos: CrearUbicacionDto): Promise<UbicacionVendedor> {
    const ubicacion = this.ubicacionRepositorio.create(datos);
    return this.ubicacionRepositorio.save(ubicacion);
  }

  async listarUbicaciones(vendedor_id: string): Promise<UbicacionVendedor[]> {
    return this.ubicacionRepositorio.find({ where: { vendedor_id }, order: { timestamp_ubicacion: 'DESC' } });
  }

  async obtenerCalificacion(vendedor_id: string): Promise<{ calificacion_promedio: number; total_resenas: number }> {
    const vendedor = await this.vendedorRepositorio.findOne({ where: { vendedor_id } });
    if (!vendedor) {
      throw new BadRequestException('Vendedor no encontrado');
    }
    return {
      calificacion_promedio: vendedor.calificacion_promedio,
      total_resenas: vendedor.total_resenas
    };
  }
} 