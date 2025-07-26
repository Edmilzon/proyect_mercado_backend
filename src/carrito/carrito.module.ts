import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CarritoService } from './carrito.service';
import { CarritoController } from './carrito.controller';
import { Producto } from '../productos/producto.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Producto])],
  providers: [CarritoService],
  controllers: [CarritoController],
  exports: [CarritoService],
})
export class CarritoModule {} 