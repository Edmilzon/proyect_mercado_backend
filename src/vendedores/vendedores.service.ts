import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vendedor } from './vendedor.entity';
import { CrearVendedorDto } from './dto/crear-vendedor.dto';
import { UbicacionVendedor } from './ubicacion-vendedor.entity';
import { CrearUbicacionDto } from './dto/crear-ubicacion.dto';
import { Usuario } from '../usuarios/usuario.entity';

@Injectable()
export class VendedoresService {
  constructor(
    @InjectRepository(Vendedor)
    private readonly vendedorRepositorio: Repository<Vendedor>,
    @InjectRepository(UbicacionVendedor)
    private readonly ubicacionRepositorio: Repository<UbicacionVendedor>,
    @InjectRepository(Usuario)
    private readonly usuarioRepositorio: Repository<Usuario>,
  ) {}

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
    return this.vendedorRepositorio.find();
  }

  async crearUbicacion(datos: CrearUbicacionDto): Promise<UbicacionVendedor> {
    const ubicacion = this.ubicacionRepositorio.create(datos);
    return this.ubicacionRepositorio.save(ubicacion);
  }

  async listarUbicaciones(vendedor_id: string): Promise<UbicacionVendedor[]> {
    return this.ubicacionRepositorio.find({ where: { vendedor_id }, order: { timestamp_ubicacion: 'DESC' } });
  }
} 