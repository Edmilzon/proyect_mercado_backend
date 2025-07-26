import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pedido } from './pedido.entity';
import { ItemPedido } from './item-pedido.entity';
import { PedidosService } from './pedidos.service';
import { PedidosController } from './pedidos.controller';
import { Producto } from '../productos/producto.entity';
import { Usuario } from '../usuarios/usuario.entity';
import { DireccionUsuario } from '../usuarios/direccion.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Pedido, ItemPedido, Producto, Usuario, DireccionUsuario])],
  providers: [PedidosService],
  controllers: [PedidosController],
  exports: [PedidosService],
})
export class PedidosModule {} 