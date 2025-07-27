import { Controller, Post, Body, Get, Param, Put, Delete, Query, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { ValidarVendedorDto } from '../vendedores/dto/validar-vendedor.dto';
import { CrearCodigoDescuentoDto } from '../vendedores/dto/crear-codigo-descuento.dto';
import { JwtAuthGuard } from '../autenticacion/jwt-auth.guard';
import { RolesGuard } from '../autenticacion/roles.guard';
import { Roles } from '../autenticacion/roles.decorator';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'super_admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ===== VALIDACIÓN DE VENDEDORES =====
  @Post('vendedores/validar')
  async validarVendedor(@Body() datos: ValidarVendedorDto) {
    const vendedor = await this.adminService.validarVendedor(datos);
    return { 
      mensaje: 'Vendedor validado correctamente', 
      vendedor 
    };
  }

  @Get('vendedores/pendientes')
  async listarVendedoresPendientes() {
    const vendedores = await this.adminService.listarVendedoresPendientes();
    return { vendedores };
  }

  @Get('vendedores/estadisticas')
  async obtenerEstadisticasVendedores() {
    const estadisticas = await this.adminService.obtenerEstadisticasVendedores();
    return { estadisticas };
  }

  // ===== DASHBOARD ADMINISTRATIVO =====
  @Get('dashboard')
  async obtenerDashboard() {
    const dashboard = await this.adminService.obtenerDashboardAdmin();
    return { dashboard };
  }

  // ===== GESTIÓN DE USUARIOS =====
  @Get('usuarios')
  async listarUsuarios(
    @Query('rol') rol?: string,
    @Query('esta_activo') esta_activo?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const filtros = {
      rol,
      esta_activo: esta_activo ? esta_activo === 'true' : undefined,
      limit: limit ? parseInt(limit) : 20,
      offset: offset ? parseInt(offset) : 0,
    };

    const resultado = await this.adminService.listarUsuarios(filtros);
    return resultado;
  }

  @Put('usuarios/:usuario_id/estado')
  async cambiarEstadoUsuario(
    @Param('usuario_id') usuario_id: string,
    @Body() datos: { esta_activo: boolean }
  ) {
    const usuario = await this.adminService.cambiarEstadoUsuario(usuario_id, datos.esta_activo);
    return { 
      mensaje: 'Estado de usuario actualizado correctamente', 
      usuario 
    };
  }

  // ===== GESTIÓN DE CÓDIGOS DE DESCUENTO =====
  @Post('codigos-descuento')
  async crearCodigoDescuento(@Body() datos: CrearCodigoDescuentoDto) {
    // Convertir fechas de string a Date
    const datosConvertidos = {
      ...datos,
      fecha_inicio: datos.fecha_inicio ? new Date(datos.fecha_inicio) : undefined,
      fecha_fin: datos.fecha_fin ? new Date(datos.fecha_fin) : undefined,
    };

    const codigo = await this.adminService.crearCodigoDescuento(datosConvertidos);
    return { mensaje: 'Código de descuento creado correctamente', codigo };
  }

  @Get('codigos-descuento')
  async listarCodigosDescuento() {
    const codigos = await this.adminService.listarCodigosDescuento();
    return { codigos };
  }

  @Put('codigos-descuento/:codigo_id')
  async actualizarCodigoDescuento(
    @Param('codigo_id') codigo_id: string,
    @Body() datos: Partial<CrearCodigoDescuentoDto>
  ) {
    // Convertir fechas de string a Date
    const datosConvertidos = {
      ...datos,
      fecha_inicio: datos.fecha_inicio ? new Date(datos.fecha_inicio) : undefined,
      fecha_fin: datos.fecha_fin ? new Date(datos.fecha_fin) : undefined,
    };

    const codigo = await this.adminService.actualizarCodigoDescuento(codigo_id, datosConvertidos);
    return { mensaje: 'Código de descuento actualizado correctamente', codigo };
  }

  @Delete('codigos-descuento/:codigo_id')
  async eliminarCodigoDescuento(@Param('codigo_id') codigo_id: string) {
    await this.adminService.eliminarCodigoDescuento(codigo_id);
    return { mensaje: 'Código de descuento eliminado correctamente' };
  }

  // ===== REPORTES =====
  @Get('reportes/ventas')
  async generarReporteVentas(
    @Query('fecha_inicio') fecha_inicio: string,
    @Query('fecha_fin') fecha_fin: string,
  ) {
    const reporte = await this.adminService.generarReporteVentas(
      new Date(fecha_inicio),
      new Date(fecha_fin)
    );
    return { reporte };
  }

  @Get('reportes/productos')
  async generarReporteProductos() {
    const reporte = await this.adminService.generarReporteProductos();
    return { reporte };
  }

  // ===== NOTIFICACIONES SISTEMA =====
  @Post('notificaciones/sistema')
  async enviarNotificacionSistema(@Body() datos: {
    usuario_id: string;
    titulo: string;
    mensaje: string;
    url_redireccion?: string;
  }) {
    const notificacion = await this.adminService.enviarNotificacionSistema(datos);
    return { 
      mensaje: 'Notificación enviada correctamente', 
      notificacion 
    };
  }
} 