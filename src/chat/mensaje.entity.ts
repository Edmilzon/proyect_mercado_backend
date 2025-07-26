import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Conversacion } from './conversacion.entity';
import { Usuario } from '../usuarios/usuario.entity';

@Entity('mensajes')
@Index(['conversacion_id'])
@Index(['enviado_at'])
export class Mensaje {
  @PrimaryGeneratedColumn('uuid')
  mensaje_id: string;

  @Column()
  conversacion_id: string;

  @ManyToOne(() => Conversacion, conversacion => conversacion.mensajes)
  @JoinColumn({ name: 'conversacion_id' })
  conversacion: Conversacion;

  @Column()
  remitente_id: string;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'remitente_id' })
  remitente: Usuario;

  @Column({ type: 'text' })
  contenido: string;

  @Column({ length: 50, default: 'texto' })
  tipo_mensaje: string;

  @Column({ nullable: true, length: 255 })
  url_archivo: string;

  @Column({ default: false })
  es_leido: boolean;

  @CreateDateColumn({ name: 'enviado_at' })
  enviado_at: Date;
} 