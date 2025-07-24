import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Index, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Usuario } from './usuario.entity';

@Entity('direcciones_usuario')
@Index(['usuario_id'])
export class DireccionUsuario {
  @PrimaryGeneratedColumn('uuid')
  direccion_id: string;

  @Column()
  usuario_id: string;

  @ManyToOne(() => Usuario)
  usuario: Usuario;

  @Column({ nullable: true, length: 100 })
  etiqueta?: string;

  @Column({ length: 255 })
  calle_avenida: string;

  @Column({ length: 100 })
  ciudad: string;

  @Column({ length: 100 })
  departamento: string;

  @Column({ nullable: true, length: 20 })
  codigo_postal?: string;

  @Column({ length: 100, default: 'Bolivia' })
  pais: string;

  @Column('decimal', { precision: 9, scale: 6 })
  latitud: number;

  @Column('decimal', { precision: 9, scale: 6 })
  longitud: number;

  @Column({ default: false })
  es_predeterminada: boolean;

  @CreateDateColumn({ name: 'creado_at' })
  creado_at: Date;

  @UpdateDateColumn({ name: 'actualizado_at' })
  actualizado_at: Date;
} 