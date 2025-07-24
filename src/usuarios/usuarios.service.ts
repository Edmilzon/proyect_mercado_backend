import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from './usuario.entity';
import { CrearUsuarioDto } from './dto/crear-usuario.dto';
import * as bcrypt from 'bcryptjs';
import { DireccionUsuario } from './direccion.entity';
import { CrearDireccionDto } from './dto/crear-direccion.dto';

@Injectable()
export class UsuariosService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepositorio: Repository<Usuario>,
    @InjectRepository(DireccionUsuario)
    private readonly direccionRepositorio: Repository<DireccionUsuario>,
  ) {}

  async crearUsuario(datos: CrearUsuarioDto): Promise<Usuario> {
    const existente = await this.usuarioRepositorio.findOne({ where: [{ email: datos.email }, { numero_telefono: datos.numero_telefono }] });
    if (existente) {
      throw new BadRequestException('El correo o número de teléfono ya está registrado');
    }
    const usuario = new Usuario();
    usuario.email = datos.email;
    usuario.password_hash = await bcrypt.hash(datos.password, 10);
    usuario.nombre = datos.nombre;
    usuario.apellido = datos.apellido;
    usuario.numero_telefono = datos.numero_telefono;
    usuario.rol = datos.rol ?? 'comprador';
    usuario.esta_activo = true;
    return this.usuarioRepositorio.save(usuario);
  }

  async buscarPorEmail(email: string): Promise<Usuario | undefined> {
    const usuario = await this.usuarioRepositorio.findOne({ where: { email } });
    return usuario ?? undefined;
  }

  async buscarPorId(usuario_id: string): Promise<Usuario | undefined> {
    const usuario = await this.usuarioRepositorio.findOne({ where: { usuario_id } });
    return usuario ?? undefined;
  }

  async crearDireccion(usuario_id: string, datos: CrearDireccionDto): Promise<DireccionUsuario> {
    const direccion = this.direccionRepositorio.create({ ...datos, usuario_id });
    return this.direccionRepositorio.save(direccion);
  }

  async listarDirecciones(usuario_id: string): Promise<DireccionUsuario[]> {
    return this.direccionRepositorio.find({ where: { usuario_id } });
  }
} 