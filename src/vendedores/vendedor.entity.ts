import { Entity, PrimaryColumn, Column, Index, CreateDateColumn, UpdateDateColumn, OneToOne, OneToMany, JoinColumn } from 'typeorm';
import { Usuario } from '../usuarios/usuario.entity';
import { Producto } from '../productos/producto.entity';

export enum EstadoValidacionVendedor {
  PENDIENTE = 'pendiente',
  APROBADO = 'aprobado',
  RECHAZADO = 'rechazado',
  SUSPENDIDO = 'suspendido'
}

@Entity('vendedores')
@Index(['estado_onboarding'])
@Index(['calificacion_promedio'])
@Index(['estado_validacion'])
export class Vendedor {
  @PrimaryColumn('uuid')
  vendedor_id: string; // FK a usuarios.usuario_id

  @OneToOne(() => Usuario)
  @JoinColumn({ name: 'vendedor_id' })
  usuario: Usuario;

  @Column({ unique: true, length: 50 })
  numero_identificacion: string;

  @Column({ length: 50, default: 'pendiente' })
  estado_onboarding: string;

  @Column({
    type: 'enum',
    enum: EstadoValidacionVendedor,
    default: EstadoValidacionVendedor.PENDIENTE
  })
  estado_validacion: EstadoValidacionVendedor;

  @Column({ type: 'text', nullable: true })
  motivo_rechazo: string | null;

  @Column({ type: 'text', nullable: true })
  notas_admin: string | null;

  @Column({ type: 'uuid', nullable: true })
  admin_validador_id: string | null;

  @Column({ type: 'timestamp', nullable: true })
  fecha_validacion: Date | null;

  @Column('decimal', { precision: 9, scale: 6, nullable: true })
  latitud_actual: number | null;

  @Column('decimal', { precision: 9, scale: 6, nullable: true })
  longitud_actual: number | null;

  @Column({ type: 'timestamp', nullable: true })
  ultima_actualizacion_ubicacion: Date | null;

  @Column('decimal', { precision: 3, scale: 2, default: 0.0 })
  calificacion_promedio: number;

  @Column({ type: 'int', default: 0 })
  total_resenas: number;

  @Column('decimal', { precision: 5, scale: 4, default: 0.1 })
  tasa_comision: number;

  @Column({ type: 'uuid', nullable: true })
  zona_asignada_id: string | null;

  @OneToMany(() => Producto, producto => producto.vendedor)
  productos: Producto[];

  @CreateDateColumn({ name: 'creado_at' })
  creado_at: Date;

  @UpdateDateColumn({ name: 'actualizado_at' })
  actualizado_at: Date;
} 