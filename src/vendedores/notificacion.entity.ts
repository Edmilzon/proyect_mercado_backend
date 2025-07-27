import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Usuario } from '../usuarios/usuario.entity';

export enum TipoNotificacion {
  PEDIDO_NUEVO = 'pedido_nuevo',
  PEDIDO_ACTUALIZADO = 'pedido_actualizado',
  MENSAJE_NUEVO = 'mensaje_nuevo',
  RESENA_NUEVA = 'resena_nueva',
  PRODUCTO_APROBADO = 'producto_aprobado',
  PRODUCTO_RECHAZADO = 'producto_rechazado',
  VENDEDOR_APROBADO = 'vendedor_aprobado',
  VENDEDOR_RECHAZADO = 'vendedor_rechazado',
  SISTEMA = 'sistema'
}

@Entity('notificaciones')
@Index(['usuario_id', 'es_leida'])
@Index(['usuario_id', 'tipo'])
export class Notificacion {
  @PrimaryGeneratedColumn('uuid')
  notificacion_id: string;

  @Column()
  usuario_id: string;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @Column({
    type: 'enum',
    enum: TipoNotificacion
  })
  tipo: TipoNotificacion;

  @Column({ length: 255 })
  titulo: string;

  @Column({ type: 'text' })
  mensaje: string;

  @Column({ nullable: true })
  entidad_id: string; // ID del pedido, producto, etc.

  @Column({ nullable: true, length: 255 })
  url_redireccion: string;

  @Column({ default: false })
  es_leida: boolean;

  @CreateDateColumn({ name: 'creado_at' })
  creado_at: Date;
} 