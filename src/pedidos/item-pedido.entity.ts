import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Pedido } from './pedido.entity';
import { Producto } from '../productos/producto.entity';

@Entity('items_pedido')
@Index(['pedido_id'])
@Index(['producto_id'])
export class ItemPedido {
  @PrimaryGeneratedColumn('uuid')
  item_pedido_id: string;

  @Column()
  pedido_id: string;

  @ManyToOne(() => Pedido, pedido => pedido.items)
  @JoinColumn({ name: 'pedido_id' })
  pedido: Pedido;

  @Column()
  producto_id: string;

  @ManyToOne(() => Producto)
  @JoinColumn({ name: 'producto_id' })
  producto: Producto;

  @Column()
  cantidad: number;

  @Column('decimal', { precision: 10, scale: 2 })
  precio_en_compra: number;

  @Column('decimal', { precision: 10, scale: 2 })
  total_item_precio: number;

  @CreateDateColumn({ name: 'creado_at' })
  creado_at: Date;
} 