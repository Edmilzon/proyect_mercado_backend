import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { CategoriaProducto } from '../categorias/categoria.entity';
import { ImagenProducto } from './imagen-producto.entity';
import { Vendedor } from '../vendedores/vendedor.entity';

@Entity('productos')
@Index(['categoria_id'])
@Index(['nombre'])
@Index(['vendedor_id'])
export class Producto {
  @PrimaryGeneratedColumn('uuid')
  producto_id: string;

  @Column({ length: 255 })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column('decimal', { precision: 10, scale: 2 })
  precio_base: number;

  @Column('decimal', { precision: 10, scale: 2 })
  precio_actual: number;

  @Column()
  categoria_id: string;

  @ManyToOne(() => CategoriaProducto)
  @JoinColumn({ name: 'categoria_id' })
  categoria: CategoriaProducto;

  @Column({ type: 'uuid' })
  vendedor_id: string;

  @ManyToOne(() => Vendedor)
  @JoinColumn({ name: 'vendedor_id' })
  vendedor: Vendedor;

  @Column({ default: 0 })
  cantidad_stock: number;

  @Column({ nullable: true, length: 255 })
  url_imagen_principal: string;

  @Column({ default: true })
  esta_activo: boolean;

  @Column({ unique: true, length: 100, nullable: true })
  sku: string;

  @Column({ nullable: true })
  peso_g: number;

  @OneToMany(() => ImagenProducto, imagen => imagen.producto)
  imagenes: ImagenProducto[];

  @CreateDateColumn({ name: 'creado_at' })
  creado_at: Date;

  @UpdateDateColumn({ name: 'actualizado_at' })
  actualizado_at: Date;
} 