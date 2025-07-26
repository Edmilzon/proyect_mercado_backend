import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Pedido } from '../pedidos/pedido.entity';

@Entity('pagos')
@Index(['pedido_id'])
@Index(['transaccion_id'])
@Index(['estado'])
export class Pago {
  @PrimaryGeneratedColumn('uuid')
  pago_id: string;

  @Column({ unique: true })
  pedido_id: string;

  @ManyToOne(() => Pedido, pedido => pedido.pagos)
  @JoinColumn({ name: 'pedido_id' })
  pedido: Pedido;

  @Column({ unique: true, length: 255 })
  transaccion_id: string;

  @Column('decimal', { precision: 10, scale: 2 })
  monto: number;

  @Column({ length: 3, default: 'BOB' })
  moneda: string;

  @Column({ length: 50 })
  metodo_pago: string;

  @Column({ length: 50, default: 'pendiente' })
  estado: string;

  @CreateDateColumn({ name: 'fecha_pago' })
  fecha_pago: Date;

  @Column({ nullable: true, length: 100 })
  procesado_por: string;

  @Column({ type: 'text', nullable: true })
  notas: string;

  @CreateDateColumn({ name: 'creado_at' })
  creado_at: Date;

  @UpdateDateColumn({ name: 'actualizado_at' })
  actualizado_at: Date;
} 