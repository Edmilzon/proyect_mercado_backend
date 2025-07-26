import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Conversacion } from './conversacion.entity';
import { Usuario } from '../usuarios/usuario.entity';

@Entity('participantes_conversacion')
@Index(['conversacion_id'])
@Index(['usuario_id'])
export class ParticipanteConversacion {
  @PrimaryGeneratedColumn('uuid')
  participante_id: string;

  @Column()
  conversacion_id: string;

  @ManyToOne(() => Conversacion, conversacion => conversacion.participantes)
  @JoinColumn({ name: 'conversacion_id' })
  conversacion: Conversacion;

  @Column()
  usuario_id: string;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @CreateDateColumn({ name: 'fecha_union' })
  fecha_union: Date;

  @Column({ type: 'timestamp', nullable: true })
  fecha_salida: Date;

  @Column({ default: false })
  es_admin_conversacion: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  ultimo_visto_at: Date;
} 