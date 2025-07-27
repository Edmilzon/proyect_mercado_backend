import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompradoresService } from './compradores.service';
import { CompradoresController } from './compradores.controller';
import { Usuario } from '../usuarios/usuario.entity';
import { Producto } from '../productos/producto.entity';
import { Pedido } from '../pedidos/pedido.entity';
import { Favorito } from '../vendedores/favorito.entity';
import { Notificacion } from '../vendedores/notificacion.entity';
import { CodigoDescuento } from '../vendedores/codigo-descuento.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Usuario,
      Producto,
      Pedido,
      Favorito,
      Notificacion,
      CodigoDescuento
    ])
  ],
  providers: [CompradoresService],
  controllers: [CompradoresController],
  exports: [CompradoresService],
})
export class CompradoresModule {} 