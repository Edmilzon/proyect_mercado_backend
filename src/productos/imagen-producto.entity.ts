import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Producto } from './producto.entity';

@Entity('imagenes_producto')
@Index(['producto_id'])
export class ImagenProducto {
  @PrimaryGeneratedColumn('uuid')
  imagen_id: string;

  @Column()
  producto_id: string;

  @ManyToOne(() => Producto, producto => producto.imagenes)
  @JoinColumn({ name: 'producto_id' })
  producto: Producto;

  @Column({ length: 255 })
  url_imagen: string;

  @Column({ nullable: true })
  orden_indice: number;

  @CreateDateColumn({ name: 'creado_at' })
  creado_at: Date;
} 