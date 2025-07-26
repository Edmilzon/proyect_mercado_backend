import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Resena } from './resena.entity';
import { ResenasService } from './resenas.service';
import { ResenasController } from './resenas.controller';
import { Pedido } from '../pedidos/pedido.entity';
import { Usuario } from '../usuarios/usuario.entity';
import { Vendedor } from '../vendedores/vendedor.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Resena, Pedido, Usuario, Vendedor])],
  providers: [ResenasService],
  controllers: [ResenasController],
  exports: [ResenasService],
})
export class ResenasModule {} 