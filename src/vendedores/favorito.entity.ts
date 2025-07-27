import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Usuario } from '../usuarios/usuario.entity';
import { Producto } from '../productos/producto.entity';

@Entity('favoritos')
@Index(['usuario_id', 'producto_id'], { unique: true })
export class Favorito {
  @PrimaryGeneratedColumn('uuid')
  favorito_id: string;

  @Column()
  usuario_id: string;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @Column()
  producto_id: string;

  @ManyToOne(() => Producto)
  @JoinColumn({ name: 'producto_id' })
  producto: Producto;

  @CreateDateColumn({ name: 'creado_at' })
  creado_at: Date;
} 