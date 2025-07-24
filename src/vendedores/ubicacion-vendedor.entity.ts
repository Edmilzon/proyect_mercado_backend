import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn } from 'typeorm';

@Entity('ubicaciones_vendedor')
@Index(['vendedor_id'])
@Index(['timestamp_ubicacion'])
export class UbicacionVendedor {
  @PrimaryGeneratedColumn('uuid')
  ubicacion_id: string;

  @Column()
  vendedor_id: string;

  @Column({ nullable: true })
  pedido_id: string;

  @Column('decimal', { precision: 9, scale: 6 })
  latitud: number;

  @Column('decimal', { precision: 9, scale: 6 })
  longitud: number;

  @CreateDateColumn({ name: 'timestamp_ubicacion' })
  timestamp_ubicacion: Date;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  precision_m: number;
} 