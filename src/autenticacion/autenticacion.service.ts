import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsuariosService } from '../usuarios/usuarios.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AutenticacionService {
  constructor(
    private readonly usuariosService: UsuariosService,
    private readonly jwtService: JwtService,
  ) {}

  async login(datos: LoginDto) {
    const usuario = await this.usuariosService.buscarPorEmail(datos.email);
    if (!usuario || !(await bcrypt.compare(datos.password, usuario.password_hash))) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }
    
    const payload = { sub: usuario.usuario_id, email: usuario.email };
    const token = this.jwtService.sign(payload);
    
    return {
      token,
      usuario: {
        usuario_id: usuario.usuario_id,
        email: usuario.email,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        numero_telefono: usuario.numero_telefono,
        rol: usuario.rol,
        esta_activo: usuario.esta_activo,
        ultima_sesion_at: usuario.ultima_sesion_at,
        creado_at: usuario.creado_at,
      },
    };
  }
} 