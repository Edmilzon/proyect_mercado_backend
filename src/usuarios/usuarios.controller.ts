import { Controller, Post, Body, BadRequestException, Param, Get, UseGuards, Request } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { CrearUsuarioDto } from './dto/crear-usuario.dto';
import { CrearDireccionDto } from './dto/crear-direccion.dto';
import { JwtAuthGuard } from '../autenticacion/jwt-auth.guard';

@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Post('registro')
  async registrar(@Body() datos: CrearUsuarioDto) {
    const usuario = await this.usuariosService.crearUsuario(datos);
    return {
      mensaje: 'Usuario registrado correctamente',
      usuario: {
        usuario_id: usuario.usuario_id,
        email: usuario.email,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        numero_telefono: usuario.numero_telefono,
        rol: usuario.rol,
        esta_activo: usuario.esta_activo,
        creado_at: usuario.creado_at,
      },
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post(':usuario_id/direcciones')
  async crearDireccion(
    @Body() datos: CrearDireccionDto,
    @Param('usuario_id') usuario_id: string,
    @Request() req
  ) {
    // Solo permitir si el usuario autenticado es el mismo que el usuario_id
    if (req.user.usuario_id !== usuario_id) {
      throw new BadRequestException('No autorizado para modificar direcciones de otro usuario');
    }
    const direccion = await this.usuariosService.crearDireccion(usuario_id, datos);
    return { mensaje: 'Dirección registrada correctamente', direccion };
  }

  @UseGuards(JwtAuthGuard)
  @Get(':usuario_id/direcciones')
  async listarDirecciones(@Param('usuario_id') usuario_id: string, @Request() req) {
    if (req.user.usuario_id !== usuario_id) {
      throw new BadRequestException('No autorizado para ver direcciones de otro usuario');
    }
    const direcciones = await this.usuariosService.listarDirecciones(usuario_id);
    return { direcciones };
  }
} 