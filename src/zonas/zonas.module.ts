import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ZonaEntrega } from './zonas.entity';
import { ZonasService } from './zonas.service';
import { ZonasController } from './zonas.controller';
import { Vendedor } from '../vendedores/vendedor.entity';
import { DireccionUsuario } from '../usuarios/direccion.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ZonaEntrega, Vendedor, DireccionUsuario])],
  providers: [ZonasService],
  controllers: [ZonasController],
  exports: [ZonasService],
})
export class ZonasModule {} 