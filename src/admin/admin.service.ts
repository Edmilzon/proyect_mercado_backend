import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, IsNull } from 'typeorm';
import { Vendedor, EstadoValidacionVendedor } from '../vendedores/vendedor.entity';
import { ValidarVendedorDto, EstadoValidacionVendedor as EstadoValidacionDto } from '../vendedores/dto/validar-vendedor.dto';
import { Usuario } from '../usuarios/usuario.entity';
import { Producto } from '../productos/producto.entity';
import { Pedido } from '../pedidos/pedido.entity';
import { Resena } from '../resenas/resena.entity';
import { Conversacion } from '../chat/conversacion.entity';
import { Mensaje } from '../chat/mensaje.entity';
import { Notificacion, TipoNotificacion } from '../vendedores/notificacion.entity';
import { CodigoDescuento } from '../vendedores/codigo-descuento.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Vendedor)
    private readonly vendedorRepositorio: Repository<Vendedor>,
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
    @InjectRepository(Notificacion)
    private readonly notificacionRepositorio: Repository<Notificacion>,
    @InjectRepository(CodigoDescuento)
    private readonly codigoDescuentoRepositorio: Repository<CodigoDescuento>,
  ) {}

  // ===== VALIDACIÓN DE VENDEDORES =====
  async validarVendedor(datos: ValidarVendedorDto): Promise<Vendedor> {
    // Verificar que el admin existe y tiene permisos
    const admin = await this.usuarioRepositorio.findOne({ 
      where: { usuario_id: datos.admin_id, rol: 'admin' } 
    });
    if (!admin) {
      throw new ForbiddenException('No tienes permisos para validar vendedores');
    }

    // Buscar el vendedor
    const vendedor = await this.vendedorRepositorio.findOne({ 
      where: { vendedor_id: datos.vendedor_id } 
    });
    if (!vendedor) {
      throw new BadRequestException('Vendedor no encontrado');
    }

    // Actualizar estado de validación
    vendedor.estado_validacion = datos.estado as EstadoValidacionVendedor;
    vendedor.motivo_rechazo = datos.motivo_rechazo || null;
    vendedor.notas_admin = datos.notas_admin || null;
    vendedor.admin_validador_id = datos.admin_id;
    vendedor.fecha_validacion = new Date();

    const vendedorActualizado = await this.vendedorRepositorio.save(vendedor);

    // Crear notificación para el vendedor
    await this.crearNotificacionValidacion(vendedor.vendedor_id, datos.estado);

    return vendedorActualizado;
  }

  async listarVendedoresPendientes(): Promise<Vendedor[]> {
    return this.vendedorRepositorio.find({
      where: { estado_validacion: EstadoValidacionVendedor.PENDIENTE },
      relations: ['usuario'],
      order: { creado_at: 'ASC' }
    });
  }

  async obtenerEstadisticasVendedores(): Promise<any> {
    const [
      totalVendedores,
      vendedoresPendientes,
      vendedoresAprobados,
      vendedoresRechazados,
      vendedoresSuspendidos
    ] = await Promise.all([
      this.vendedorRepositorio.count(),
      this.vendedorRepositorio.count({ where: { estado_validacion: EstadoValidacionVendedor.PENDIENTE } }),
      this.vendedorRepositorio.count({ where: { estado_validacion: EstadoValidacionVendedor.APROBADO } }),
      this.vendedorRepositorio.count({ where: { estado_validacion: EstadoValidacionVendedor.RECHAZADO } }),
      this.vendedorRepositorio.count({ where: { estado_validacion: EstadoValidacionVendedor.SUSPENDIDO } }),
    ]);

    return {
      total_vendedores: totalVendedores,
      pendientes: vendedoresPendientes,
      aprobados: vendedoresAprobados,
      rechazados: vendedoresRechazados,
      suspendidos: vendedoresSuspendidos
    };
  }

  // ===== DASHBOARD ADMINISTRATIVO =====
  async obtenerDashboardAdmin(): Promise<any> {
    const hoy = new Date();
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

    const [
      totalUsuarios,
      totalProductos,
      totalPedidos,
      totalVentas,
      pedidosHoy,
      ventasHoy,
      ventasMes,
      productosPendientes
    ] = await Promise.all([
      this.usuarioRepositorio.count(),
      this.productoRepositorio.count(),
      this.pedidoRepositorio.count(),
      this.pedidoRepositorio
        .createQueryBuilder('pedido')
        .select('SUM(pedido.monto_final)', 'total')
        .where('pedido.estado = :estado', { estado: 'entregado' })
        .getRawOne(),
      this.pedidoRepositorio.count({ 
        where: { 
          fecha_pedido: Between(hoy, hoy) 
        } 
      }),
      this.pedidoRepositorio
        .createQueryBuilder('pedido')
        .select('SUM(pedido.monto_final)', 'total')
        .where('pedido.estado = :estado', { estado: 'entregado' })
        .andWhere('DATE(pedido.fecha_pedido) = DATE(:hoy)', { hoy })
        .getRawOne(),
      this.pedidoRepositorio
        .createQueryBuilder('pedido')
        .select('SUM(pedido.monto_final)', 'total')
        .where('pedido.estado = :estado', { estado: 'entregado' })
        .andWhere('pedido.fecha_pedido >= :inicioMes', { inicioMes })
        .getRawOne(),
      this.productoRepositorio.count({ where: { esta_activo: false } })
    ]);

    return {
      total_usuarios: totalUsuarios,
      total_productos: totalProductos,
      total_pedidos: totalPedidos,
      total_ventas: parseFloat(totalVentas?.total || '0'),
      pedidos_hoy: pedidosHoy,
      ventas_hoy: parseFloat(ventasHoy?.total || '0'),
      ventas_mes: parseFloat(ventasMes?.total || '0'),
      productos_pendientes: productosPendientes
    };
  }

  // ===== GESTIÓN DE USUARIOS =====
  async listarUsuarios(filtros?: {
    rol?: string;
    esta_activo?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<{ usuarios: Usuario[], total: number }> {
    const queryBuilder = this.usuarioRepositorio.createQueryBuilder('usuario');

    if (filtros?.rol) {
      queryBuilder.andWhere('usuario.rol = :rol', { rol: filtros.rol });
    }

    if (filtros?.esta_activo !== undefined) {
      queryBuilder.andWhere('usuario.esta_activo = :esta_activo', { esta_activo: filtros.esta_activo });
    }

    const total = await queryBuilder.getCount();

    queryBuilder
      .orderBy('usuario.creado_at', 'DESC')
      .skip(filtros?.offset || 0)
      .take(filtros?.limit || 20);

    const usuarios = await queryBuilder.getMany();

    return { usuarios, total };
  }

  async cambiarEstadoUsuario(usuario_id: string, esta_activo: boolean): Promise<Usuario> {
    const usuario = await this.usuarioRepositorio.findOne({ where: { usuario_id } });
    if (!usuario) {
      throw new BadRequestException('Usuario no encontrado');
    }

    usuario.esta_activo = esta_activo;
    return this.usuarioRepositorio.save(usuario);
  }

  // ===== GESTIÓN DE CÓDIGOS DE DESCUENTO =====
  async crearCodigoDescuento(datos: Partial<CodigoDescuento>): Promise<CodigoDescuento> {
    const codigo = this.codigoDescuentoRepositorio.create(datos);
    return this.codigoDescuentoRepositorio.save(codigo);
  }

  async listarCodigosDescuento(): Promise<CodigoDescuento[]> {
    return this.codigoDescuentoRepositorio.find({
      order: { creado_at: 'DESC' }
    });
  }

  async actualizarCodigoDescuento(codigo_id: string, datos: Partial<CodigoDescuento>): Promise<CodigoDescuento> {
    const codigo = await this.codigoDescuentoRepositorio.findOne({ where: { codigo_id } });
    if (!codigo) {
      throw new BadRequestException('Código de descuento no encontrado');
    }

    Object.assign(codigo, datos);
    return this.codigoDescuentoRepositorio.save(codigo);
  }

  async eliminarCodigoDescuento(codigo_id: string): Promise<void> {
    const codigo = await this.codigoDescuentoRepositorio.findOne({ where: { codigo_id } });
    if (!codigo) {
      throw new BadRequestException('Código de descuento no encontrado');
    }

    await this.codigoDescuentoRepositorio.remove(codigo);
  }

  // ===== REPORTES =====
  async generarReporteVentas(fecha_inicio: Date, fecha_fin: Date): Promise<any> {
    const ventas = await this.pedidoRepositorio
      .createQueryBuilder('pedido')
      .leftJoinAndSelect('pedido.comprador', 'comprador')
      .leftJoinAndSelect('pedido.vendedor', 'vendedor')
      .where('pedido.fecha_pedido BETWEEN :fecha_inicio AND :fecha_fin', { fecha_inicio, fecha_fin })
      .andWhere('pedido.estado = :estado', { estado: 'entregado' })
      .orderBy('pedido.fecha_pedido', 'DESC')
      .getMany();

    const totalVentas = ventas.reduce((sum, pedido) => sum + parseFloat(pedido.monto_final.toString()), 0);
    const totalPedidos = ventas.length;

    return {
      fecha_inicio,
      fecha_fin,
      total_ventas: totalVentas,
      total_pedidos: totalPedidos,
      ventas_por_dia: ventas,
      promedio_por_pedido: totalPedidos > 0 ? totalVentas / totalPedidos : 0
    };
  }

  async generarReporteProductos(): Promise<any> {
    const productos = await this.productoRepositorio
      .createQueryBuilder('producto')
      .leftJoinAndSelect('producto.vendedor', 'vendedor')
      .leftJoinAndSelect('producto.categoria', 'categoria')
      .orderBy('producto.creado_at', 'DESC')
      .getMany();

    const productosActivos = productos.filter(p => p.esta_activo).length;
    const productosSinStock = productos.filter(p => p.cantidad_stock === 0).length;

    return {
      total_productos: productos.length,
      productos_activos: productosActivos,
      productos_sin_stock: productosSinStock,
      productos_por_categoria: productos,
      productos_por_vendedor: productos
    };
  }

  // ===== NOTIFICACIONES =====
  private async crearNotificacionValidacion(vendedor_id: string, estado: string): Promise<void> {
    const titulo = estado === 'aprobado' ? '¡Vendedor Aprobado!' : 'Vendedor Rechazado';
    const mensaje = estado === 'aprobado' 
      ? 'Tu cuenta de vendedor ha sido aprobada. Ya puedes comenzar a vender productos.'
      : 'Tu cuenta de vendedor ha sido rechazada. Contacta al administrador para más información.';

    const notificacion = this.notificacionRepositorio.create({
      usuario_id: vendedor_id,
      tipo: estado === 'aprobado' ? TipoNotificacion.VENDEDOR_APROBADO : TipoNotificacion.VENDEDOR_RECHAZADO,
      titulo,
      mensaje
    });

    await this.notificacionRepositorio.save(notificacion);
  }

  async enviarNotificacionSistema(datos: Partial<Notificacion>): Promise<Notificacion> {
    const notificacion = this.notificacionRepositorio.create({
      ...datos,
      tipo: TipoNotificacion.SISTEMA
    });

    return this.notificacionRepositorio.save(notificacion);
  }
}