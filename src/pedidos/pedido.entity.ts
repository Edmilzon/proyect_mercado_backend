import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Usuario } from '../usuarios/usuario.entity';
import { Vendedor } from '../vendedores/vendedor.entity';
import { DireccionUsuario } from '../usuarios/direccion.entity';
import { ItemPedido } from './item-pedido.entity';
import { Pago } from '../pagos/pago.entity';

@Entity('pedidos')
@Index(['comprador_id'])
@Index(['vendedor_id'])
@Index(['estado'])
export class Pedido {
  @PrimaryGeneratedColumn('uuid')
  pedido_id: string;

  @Column()
  comprador_id: string;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'comprador_id' })
  comprador: Usuario;

  @Column({ nullable: true })
  vendedor_id: string;

  @ManyToOne(() => Vendedor)
  @JoinColumn({ name: 'vendedor_id' })
  vendedor: Vendedor;

  @Column()
  direccion_entrega_id: string;

  @ManyToOne(() => DireccionUsuario)
  @JoinColumn({ name: 'direccion_entrega_id' })
  direccion_entrega: DireccionUsuario;

  @CreateDateColumn({ name: 'fecha_pedido' })
  fecha_pedido: Date;

  @Column('decimal', { precision: 10, scale: 2 })
  monto_total: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0.00 })
  costo_envio: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0.00 })
  monto_descuento: number;

  @Column('decimal', { precision: 10, scale: 2 })
  monto_final: number;

  @Column({ length: 50, default: 'pendiente' })
  estado: string;

  @Column({ type: 'timestamp', nullable: true })
  hora_estimada_entrega: Date;

  @Column({ type: 'timestamp', nullable: true })
  hora_real_entrega: Date;

  @Column({ type: 'text', nullable: true })
  notas_comprador: string;

  @Column({ type: 'text', nullable: true })
  notas_vendedor: string;

  @Column({ nullable: true, length: 255, unique: true })
  whatsapp_pedido_id: string;

  @Column({ nullable: true, length: 255, unique: true })
  url_codigo_qr: string;

  @OneToMany(() => ItemPedido, item => item.pedido)
  items: ItemPedido[];

  @OneToMany(() => Pago, pago => pago.pedido)
  pagos: Pago[];

  @CreateDateColumn({ name: 'creado_at' })
  creado_at: Date;

  @UpdateDateColumn({ name: 'actualizado_at' })
  actualizado_at: Date;
} 