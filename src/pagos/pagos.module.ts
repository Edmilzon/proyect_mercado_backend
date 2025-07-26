import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pago } from './pago.entity';
import { PagosService } from './pagos.service';
import { PagosController } from './pagos.controller';
import { Pedido } from '../pedidos/pedido.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Pago, Pedido])],
  providers: [PagosService],
  controllers: [PagosController],
  exports: [PagosService],
})
export class PagosModule {} 