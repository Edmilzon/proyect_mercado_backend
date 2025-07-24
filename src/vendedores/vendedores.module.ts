import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Vendedor } from './vendedor.entity';
import { UbicacionVendedor } from './ubicacion-vendedor.entity';
import { VendedoresService } from './vendedores.service';
import { VendedoresController } from './vendedores.controller';
import { UbicacionGateway } from './ubicacion.gateway';
import { Usuario } from '../usuarios/usuario.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Vendedor, UbicacionVendedor, Usuario])],
  providers: [VendedoresService, UbicacionGateway],
  controllers: [VendedoresController],
  exports: [VendedoresService],
})
export class VendedoresModule {} 