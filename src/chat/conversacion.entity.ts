import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Pedido } from '../pedidos/pedido.entity';
import { ParticipanteConversacion } from './participante-conversacion.entity';
import { Mensaje } from './mensaje.entity';

@Entity('conversaciones')
@Index(['pedido_id'])
@Index(['ultimo_mensaje_at'])
@Index(['estado'])
export class Conversacion {
  @PrimaryGeneratedColumn('uuid')
  conversacion_id: string;

  @Column({ nullable: true })
  pedido_id: string;

  @ManyToOne(() => Pedido)
  @JoinColumn({ name: 'pedido_id' })
  pedido: Pedido;

  @Column({ length: 50, default: 'directa' })
  tipo_conversacion: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  ultimo_mensaje_at: Date;

  @Column({ length: 50, default: 'activa' })
  estado: string;

  @OneToMany(() => ParticipanteConversacion, participante => participante.conversacion)
  participantes: ParticipanteConversacion[];

  @OneToMany(() => Mensaje, mensaje => mensaje.conversacion)
  mensajes: Mensaje[];

  @CreateDateColumn({ name: 'creado_at' })
  creado_at: Date;

  @UpdateDateColumn({ name: 'actualizado_at' })
  actualizado_at: Date;
} 