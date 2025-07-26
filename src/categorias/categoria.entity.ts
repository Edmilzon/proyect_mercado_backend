import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';

@Entity('categorias_producto')
@Index(['nombre'])
export class CategoriaProducto {
  @PrimaryGeneratedColumn('uuid')
  categoria_id: string;

  @Column({ unique: true, length: 100 })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ nullable: true })
  categoria_padre_id: string;

  @ManyToOne(() => CategoriaProducto, categoria => categoria.subcategorias)
  @JoinColumn({ name: 'categoria_padre_id' })
  categoria_padre: CategoriaProducto;

  @OneToMany(() => CategoriaProducto, categoria => categoria.categoria_padre)
  subcategorias: CategoriaProducto[];

  @CreateDateColumn({ name: 'creado_at' })
  creado_at: Date;

  @UpdateDateColumn({ name: 'actualizado_at' })
  actualizado_at: Date;
} 