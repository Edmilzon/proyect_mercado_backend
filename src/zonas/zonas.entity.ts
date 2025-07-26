import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('zonas_entrega')
@Index(['nombre'])
export class ZonaEntrega {
  @PrimaryGeneratedColumn('uuid')
  zona_id: string;

  @Column({ unique: true, length: 100 })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ type: 'text' })
  coordenadas_poligono: string;

  @Column('decimal', { precision: 10, scale: 2, default: 0.00 })
  tarifa_envio: number;

  @Column({ default: true })
  esta_activa: boolean;

  @CreateDateColumn({ name: 'creado_at' })
  creado_at: Date;

  @UpdateDateColumn({ name: 'actualizado_at' })
  actualizado_at: Date;
} 