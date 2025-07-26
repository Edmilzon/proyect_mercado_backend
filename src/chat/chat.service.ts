import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Conversacion } from './conversacion.entity';
import { ParticipanteConversacion } from './participante-conversacion.entity';
import { Mensaje } from './mensaje.entity';
import { CrearConversacionDto } from './dto/crear-conversacion.dto';
import { CrearMensajeDto } from './dto/crear-mensaje.dto';
import { BuscarConversacionDto } from './dto/buscar-conversacion.dto';
import { Usuario } from '../usuarios/usuario.entity';
import { Pedido } from '../pedidos/pedido.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Conversacion)
    private readonly conversacionRepositorio: Repository<Conversacion>,
    @InjectRepository(ParticipanteConversacion)
    private readonly participanteRepositorio: Repository<ParticipanteConversacion>,
    @InjectRepository(Mensaje)
    private readonly mensajeRepositorio: Repository<Mensaje>,
    @InjectRepository(Usuario)
    private readonly usuarioRepositorio: Repository<Usuario>,
    @InjectRepository(Pedido)
    private readonly pedidoRepositorio: Repository<Pedido>,
    private dataSource: DataSource,
  ) {}

  async crearConversacion(datos: CrearConversacionDto): Promise<Conversacion> {
    // Validar que el pedido existe si se proporciona
    if (datos.pedido_id) {
      const pedido = await this.pedidoRepositorio.findOne({ where: { pedido_id: datos.pedido_id } });
      if (!pedido) {
        throw new BadRequestException('Pedido no encontrado');
      }
    }

    // Validar que todos los participantes existen
    const participantes = await Promise.all(
      datos.participantes.map(async (usuario_id) => {
        const usuario = await this.usuarioRepositorio.findOne({ where: { usuario_id } });
        if (!usuario) {
          throw new BadRequestException(`Usuario ${usuario_id} no encontrado`);
        }
        return usuario;
      })
    );

    // Usar transacción para crear conversación y participantes
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Crear conversación
      const conversacion = this.conversacionRepositorio.create({
        pedido_id: datos.pedido_id,
        tipo_conversacion: datos.tipo_conversacion || 'directa',
        estado: 'activa',
      });

      const conversacionGuardada = await queryRunner.manager.save(conversacion);

      // Crear participantes
      const participantesData = datos.participantes.map((usuario_id) =>
        this.participanteRepositorio.create({
          conversacion_id: conversacionGuardada.conversacion_id,
          usuario_id,
          es_admin_conversacion: false,
        })
      );

      await queryRunner.manager.save(participantesData);

      await queryRunner.commitTransaction();

      // Retornar conversación con participantes
      const conversacionCompleta = await this.buscarConversacionPorId(conversacionGuardada.conversacion_id);
      if (!conversacionCompleta) {
        throw new Error('Error al recuperar la conversación creada');
      }
      return conversacionCompleta;

    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async listarConversaciones(): Promise<Conversacion[]> {
    return this.conversacionRepositorio.find({
      relations: ['participantes', 'participantes.usuario', 'pedido'],
      order: { ultimo_mensaje_at: 'DESC' }
    });
  }

  async buscarConversaciones(filtros: BuscarConversacionDto): Promise<{ conversaciones: Conversacion[], total: number }> {
    const queryBuilder = this.conversacionRepositorio.createQueryBuilder('conversacion')
      .leftJoinAndSelect('conversacion.participantes', 'participantes')
      .leftJoinAndSelect('participantes.usuario', 'usuario')
      .leftJoinAndSelect('conversacion.pedido', 'pedido');

    if (filtros.pedido_id) {
      queryBuilder.andWhere('conversacion.pedido_id = :pedido_id', { pedido_id: filtros.pedido_id });
    }

    if (filtros.tipo_conversacion) {
      queryBuilder.andWhere('conversacion.tipo_conversacion = :tipo_conversacion', { tipo_conversacion: filtros.tipo_conversacion });
    }

    if (filtros.estado) {
      queryBuilder.andWhere('conversacion.estado = :estado', { estado: filtros.estado });
    }

    const total = await queryBuilder.getCount();
    
    queryBuilder
      .orderBy('conversacion.ultimo_mensaje_at', 'DESC')
      .skip(filtros.offset || 0)
      .take(filtros.limit || 20);

    const conversaciones = await queryBuilder.getMany();

    return { conversaciones, total };
  }

  async buscarConversacionPorId(conversacion_id: string): Promise<Conversacion | undefined> {
    const conversacion = await this.conversacionRepositorio.findOne({
      where: { conversacion_id },
      relations: ['participantes', 'participantes.usuario', 'pedido']
    });
    return conversacion ?? undefined;
  }

  async listarConversacionesPorUsuario(usuario_id: string): Promise<Conversacion[]> {
    return this.conversacionRepositorio
      .createQueryBuilder('conversacion')
      .leftJoinAndSelect('conversacion.participantes', 'participantes')
      .leftJoinAndSelect('participantes.usuario', 'usuario')
      .leftJoinAndSelect('conversacion.pedido', 'pedido')
      .where('participantes.usuario_id = :usuario_id', { usuario_id })
      .andWhere('participantes.fecha_salida IS NULL')
      .orderBy('conversacion.ultimo_mensaje_at', 'DESC')
      .getMany();
  }

  async crearMensaje(datos: CrearMensajeDto, remitente_id: string): Promise<Mensaje> {
    // Validar que la conversación existe
    const conversacion = await this.buscarConversacionPorId(datos.conversacion_id);
    if (!conversacion) {
      throw new BadRequestException('Conversación no encontrada');
    }

    // Validar que el remitente es participante de la conversación
    const esParticipante = conversacion.participantes.some(
      p => p.usuario_id === remitente_id && !p.fecha_salida
    );
    if (!esParticipante) {
      throw new BadRequestException('No eres participante de esta conversación');
    }

    // Usar transacción para crear mensaje y actualizar último mensaje
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Crear mensaje
      const mensaje = this.mensajeRepositorio.create({
        ...datos,
        remitente_id,
      });

      const mensajeGuardado = await queryRunner.manager.save(mensaje);

      // Actualizar último mensaje de la conversación
      await queryRunner.manager
        .createQueryBuilder()
        .update(Conversacion)
        .set({ ultimo_mensaje_at: new Date() })
        .where('conversacion_id = :conversacion_id', { conversacion_id: datos.conversacion_id })
        .execute();

      await queryRunner.commitTransaction();

      // Retornar mensaje con relaciones
      const mensajeCompleto = await this.buscarMensajePorId(mensajeGuardado.mensaje_id);
      if (!mensajeCompleto) {
        throw new Error('Error al recuperar el mensaje creado');
      }
      return mensajeCompleto;

    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async listarMensajes(conversacion_id: string): Promise<Mensaje[]> {
    return this.mensajeRepositorio.find({
      where: { conversacion_id },
      relations: ['remitente'],
      order: { enviado_at: 'ASC' }
    });
  }

  async buscarMensajePorId(mensaje_id: string): Promise<Mensaje | undefined> {
    const mensaje = await this.mensajeRepositorio.findOne({
      where: { mensaje_id },
      relations: ['remitente', 'conversacion']
    });
    return mensaje ?? undefined;
  }

  async marcarMensajesComoLeidos(conversacion_id: string, usuario_id: string): Promise<void> {
    // Marcar mensajes como leídos
    await this.mensajeRepositorio
      .createQueryBuilder()
      .update(Mensaje)
      .set({ es_leido: true })
      .where('conversacion_id = :conversacion_id', { conversacion_id })
      .andWhere('remitente_id != :usuario_id', { usuario_id })
      .andWhere('es_leido = :es_leido', { es_leido: false })
      .execute();

    // Actualizar último visto del participante
    await this.participanteRepositorio
      .createQueryBuilder()
      .update(ParticipanteConversacion)
      .set({ ultimo_visto_at: new Date() })
      .where('conversacion_id = :conversacion_id', { conversacion_id })
      .andWhere('usuario_id = :usuario_id', { usuario_id })
      .execute();
  }

  async obtenerMensajesNoLeidos(usuario_id: string): Promise<{ conversacion_id: string; cantidad: number }[]> {
    const resultado = await this.mensajeRepositorio
      .createQueryBuilder('mensaje')
      .select('mensaje.conversacion_id', 'conversacion_id')
      .addSelect('COUNT(*)', 'cantidad')
      .where('mensaje.remitente_id != :usuario_id', { usuario_id })
      .andWhere('mensaje.es_leido = :es_leido', { es_leido: false })
      .andWhere(qb => {
        const subQuery = qb.subQuery()
          .select('p.conversacion_id')
          .from(ParticipanteConversacion, 'p')
          .where('p.usuario_id = :usuario_id', { usuario_id })
          .andWhere('p.fecha_salida IS NULL')
          .getQuery();
        return 'mensaje.conversacion_id IN ' + subQuery;
      })
      .groupBy('mensaje.conversacion_id')
      .getRawMany();

    return resultado.map(item => ({
      conversacion_id: item.conversacion_id,
      cantidad: parseInt(item.cantidad)
    }));
  }

  async agregarParticipante(conversacion_id: string, usuario_id: string): Promise<ParticipanteConversacion> {
    // Validar que la conversación existe
    const conversacion = await this.buscarConversacionPorId(conversacion_id);
    if (!conversacion) {
      throw new BadRequestException('Conversación no encontrada');
    }

    // Validar que el usuario existe
    const usuario = await this.usuarioRepositorio.findOne({ where: { usuario_id } });
    if (!usuario) {
      throw new BadRequestException('Usuario no encontrado');
    }

    // Verificar que no sea ya participante
    const participanteExistente = await this.participanteRepositorio.findOne({
      where: { conversacion_id, usuario_id }
    });
    if (participanteExistente) {
      throw new BadRequestException('El usuario ya es participante de esta conversación');
    }

    const participante = this.participanteRepositorio.create({
      conversacion_id,
      usuario_id,
      es_admin_conversacion: false,
    });

    return this.participanteRepositorio.save(participante);
  }

  async removerParticipante(conversacion_id: string, usuario_id: string): Promise<void> {
    const participante = await this.participanteRepositorio.findOne({
      where: { conversacion_id, usuario_id }
    });
    if (!participante) {
      throw new BadRequestException('Participante no encontrado');
    }

    participante.fecha_salida = new Date();
    await this.participanteRepositorio.save(participante);
  }

  async cambiarEstadoConversacion(conversacion_id: string, estado: string): Promise<Conversacion> {
    const conversacion = await this.buscarConversacionPorId(conversacion_id);
    if (!conversacion) {
      throw new BadRequestException('Conversación no encontrada');
    }

    const estadosValidos = ['activa', 'archivada', 'cerrada'];
    if (!estadosValidos.includes(estado)) {
      throw new BadRequestException('Estado no válido');
    }

    conversacion.estado = estado;
    return this.conversacionRepositorio.save(conversacion);
  }

  async eliminarMensaje(mensaje_id: string, usuario_id: string): Promise<void> {
    const mensaje = await this.buscarMensajePorId(mensaje_id);
    if (!mensaje) {
      throw new BadRequestException('Mensaje no encontrado');
    }

    // Solo el remitente puede eliminar el mensaje
    if (mensaje.remitente_id !== usuario_id) {
      throw new BadRequestException('No puedes eliminar mensajes de otros usuarios');
    }

    await this.mensajeRepositorio.remove(mensaje);
  }
} 