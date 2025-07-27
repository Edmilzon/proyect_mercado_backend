import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { Vendedor } from '../vendedores/vendedor.entity';
import { Usuario } from '../usuarios/usuario.entity';
import { Producto } from '../productos/producto.entity';
import { Pedido } from '../pedidos/pedido.entity';
import { Resena } from '../resenas/resena.entity';
import { Conversacion } from '../chat/conversacion.entity';
import { Mensaje } from '../chat/mensaje.entity';
import { Notificacion } from '../vendedores/notificacion.entity';
import { CodigoDescuento } from '../vendedores/codigo-descuento.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Vendedor,
      Usuario,
      Producto,
      Pedido,
      Resena,
      Conversacion,
      Mensaje,
      Notificacion,
      CodigoDescuento
    ])
  ],
  providers: [AdminService],
  controllers: [AdminController],
  exports: [AdminService],
})
export class AdminModule {} 