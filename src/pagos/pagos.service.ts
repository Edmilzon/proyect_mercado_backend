import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pago } from './pago.entity';
import { CrearPagoDto } from './dto/crear-pago.dto';
import { Pedido } from '../pedidos/pedido.entity';

@Injectable()
export class PagosService {
  constructor(
    @InjectRepository(Pago)
    private readonly pagoRepositorio: Repository<Pago>,
    @InjectRepository(Pedido)
    private readonly pedidoRepositorio: Repository<Pedido>,
  ) {}

  async crearPago(datos: CrearPagoDto): Promise<Pago> {
    // Validar que el pedido existe
    const pedido = await this.pedidoRepositorio.findOne({ where: { pedido_id: datos.pedido_id } });
    if (!pedido) {
      throw new BadRequestException('Pedido no encontrado');
    }

    // Verificar que no exista ya un pago para este pedido
    const pagoExistente = await this.pagoRepositorio.findOne({ where: { pedido_id: datos.pedido_id } });
    if (pagoExistente) {
      throw new BadRequestException('Ya existe un pago para este pedido');
    }

    // Verificar que el monto coincida con el monto final del pedido
    if (datos.monto !== pedido.monto_final) {
      throw new BadRequestException('El monto del pago no coincide con el monto final del pedido');
    }

    // Validar método de pago
    const metodosValidos = ['codigo_qr', 'transferencia_bancaria', 'efectivo_contra_entrega', 'tarjeta', 'billetera_movil'];
    if (!metodosValidos.includes(datos.metodo_pago)) {
      throw new BadRequestException('Método de pago no válido');
    }

    const pago = this.pagoRepositorio.create({
      ...datos,
      estado: datos.estado || 'pendiente',
      moneda: datos.moneda || 'BOB',
    });

    return this.pagoRepositorio.save(pago);
  }

  async listarPagos(): Promise<Pago[]> {
    return this.pagoRepositorio.find({
      relations: ['pedido'],
      order: { fecha_pago: 'DESC' }
    });
  }

  async buscarPorId(pago_id: string): Promise<Pago | undefined> {
    const pago = await this.pagoRepositorio.findOne({
      where: { pago_id },
      relations: ['pedido']
    });
    return pago ?? undefined;
  }

  async buscarPorPedido(pedido_id: string): Promise<Pago | undefined> {
    const pago = await this.pagoRepositorio.findOne({
      where: { pedido_id },
      relations: ['pedido']
    });
    return pago ?? undefined;
  }

  async actualizarEstado(pago_id: string, estado: string): Promise<Pago> {
    const pago = await this.buscarPorId(pago_id);
    if (!pago) {
      throw new NotFoundException('Pago no encontrado');
    }

    const estadosValidos = ['pendiente', 'completado', 'fallido', 'reembolsado', 'cancelado'];
    if (!estadosValidos.includes(estado)) {
      throw new BadRequestException('Estado no válido');
    }

    pago.estado = estado;
    return this.pagoRepositorio.save(pago);
  }

  async listarPorEstado(estado: string): Promise<Pago[]> {
    const estadosValidos = ['pendiente', 'completado', 'fallido', 'reembolsado', 'cancelado'];
    if (!estadosValidos.includes(estado)) {
      throw new BadRequestException('Estado no válido');
    }

    return this.pagoRepositorio.find({
      where: { estado },
      relations: ['pedido'],
      order: { fecha_pago: 'DESC' }
    });
  }

  async listarPorMetodo(metodo_pago: string): Promise<Pago[]> {
    const metodosValidos = ['codigo_qr', 'transferencia_bancaria', 'efectivo_contra_entrega', 'tarjeta', 'billetera_movil'];
    if (!metodosValidos.includes(metodo_pago)) {
      throw new BadRequestException('Método de pago no válido');
    }

    return this.pagoRepositorio.find({
      where: { metodo_pago },
      relations: ['pedido'],
      order: { fecha_pago: 'DESC' }
    });
  }
} 