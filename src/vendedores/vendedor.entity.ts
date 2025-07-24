import { Entity, PrimaryColumn, Column, Index, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('vendedores')
@Index(['estado_onboarding'])
@Index(['calificacion_promedio'])
export class Vendedor {
  @PrimaryColumn('uuid')
  vendedor_id: string; // FK a usuarios.usuario_id

  @Column({ unique: true, length: 50 })
  numero_identificacion: string;

  @Column({ length: 50, default: 'pendiente' })
  estado_onboarding: string;

  @Column('decimal', { precision: 9, scale: 6, nullable: true })
  latitud_actual: number;

  @Column('decimal', { precision: 9, scale: 6, nullable: true })
  longitud_actual: number;

  @Column({ type: 'timestamp', nullable: true })
  ultima_actualizacion_ubicacion: Date;

  @Column('decimal', { precision: 3, scale: 2, default: 0.0 })
  calificacion_promedio: number;

  @Column({ type: 'int', default: 0 })
  total_resenas: number;

  @Column('decimal', { precision: 5, scale: 4, default: 0.1 })
  tasa_comision: number;

  @Column({ type: 'uuid', nullable: true })
  zona_asignada_id: string;

  @CreateDateColumn({ name: 'creado_at' })
  creado_at: Date;

  @UpdateDateColumn({ name: 'actualizado_at' })
  actualizado_at: Date;
} 