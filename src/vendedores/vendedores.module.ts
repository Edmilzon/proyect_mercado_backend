import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Vendedor } from './vendedor.entity';
import { UbicacionVendedor } from './ubicacion-vendedor.entity';
import { VendedoresService } from './vendedores.service';
import { VendedoresController } from './vendedores.controller';
import { UbicacionGateway } from './ubicacion.gateway';
import { Usuario } from '../usuarios/usuario.entity';
import { Producto } from '../productos/producto.entity';
import { Pedido } from '../pedidos/pedido.entity';
import { Resena } from '../resenas/resena.entity';
import { Conversacion } from '../chat/conversacion.entity';
import { Mensaje } from '../chat/mensaje.entity';
import { ResenasModule } from '../resenas/resenas.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Vendedor, 
      UbicacionVendedor, 
      Usuario, 
      Producto, 
      Pedido, 
      Resena, 
      Conversacion, 
      Mensaje
    ]), 
    ResenasModule
  ],
  providers: [VendedoresService, UbicacionGateway],
  controllers: [VendedoresController],
  exports: [VendedoresService],
})
export class VendedoresModule {} 