import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('codigos_descuento')
@Index(['codigo'], { unique: true })
@Index(['esta_activo', 'fecha_fin'])
export class CodigoDescuento {
  @PrimaryGeneratedColumn('uuid')
  codigo_id: string;

  @Column({ unique: true, length: 50 })
  codigo: string;

  @Column({ length: 255 })
  descripcion: string;

  @Column('decimal', { precision: 5, scale: 2 })
  porcentaje_descuento: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  monto_minimo: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  monto_maximo_descuento: number;

  @Column({ nullable: true })
  usos_maximos: number;

  @Column({ default: 0 })
  usos_actuales: number;

  @Column({ type: 'timestamp', nullable: true })
  fecha_inicio: Date;

  @Column({ type: 'timestamp', nullable: true })
  fecha_fin: Date;

  @Column({ nullable: true })
  categoria_id: string;

  @Column({ default: true })
  esta_activo: boolean;

  @CreateDateColumn({ name: 'creado_at' })
  creado_at: Date;

  @UpdateDateColumn({ name: 'actualizado_at' })
  actualizado_at: Date;
} 