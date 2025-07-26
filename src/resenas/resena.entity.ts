import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Pedido } from '../pedidos/pedido.entity';
import { Usuario } from '../usuarios/usuario.entity';
import { Vendedor } from '../vendedores/vendedor.entity';

@Entity('resenas')
@Index(['vendedor_id'])
@Index(['calificacion'])
export class Resena {
  @PrimaryGeneratedColumn('uuid')
  resena_id: string;

  @Column({ unique: true })
  pedido_id: string;

  @ManyToOne(() => Pedido)
  @JoinColumn({ name: 'pedido_id' })
  pedido: Pedido;

  @Column()
  comprador_id: string;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'comprador_id' })
  comprador: Usuario;

  @Column()
  vendedor_id: string;

  @ManyToOne(() => Vendedor)
  @JoinColumn({ name: 'vendedor_id' })
  vendedor: Vendedor;

  @Column()
  calificacion: number;

  @Column({ type: 'text', nullable: true })
  comentario: string;

  @CreateDateColumn({ name: 'fecha_resena' })
  fecha_resena: Date;

  @Column({ type: 'text', nullable: true })
  respuesta_vendedor: string;

  @Column({ type: 'timestamp', nullable: true })
  fecha_respuesta: Date;

  @CreateDateColumn({ name: 'creado_at' })
  creado_at: Date;

  @UpdateDateColumn({ name: 'actualizado_at' })
  actualizado_at: Date;
} 