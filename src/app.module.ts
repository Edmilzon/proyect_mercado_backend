import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { UsuariosModule } from './usuarios/usuarios.module';
import { AutenticacionModule } from './autenticacion/autenticacion.module';
import { VendedoresModule } from './vendedores/vendedores.module';
import { ZonasModule } from './zonas/zonas.module';
import { CategoriasModule } from './categorias/categorias.module';
import { ProductosModule } from './productos/productos.module';
import { PedidosModule } from './pedidos/pedidos.module';
import { PagosModule } from './pagos/pagos.module';
import { CarritoModule } from './carrito/carrito.module';
import { ResenasModule } from './resenas/resenas.module';
import { ChatModule } from './chat/chat.module';
import { AdminModule } from './admin/admin.module';
import { CompradoresModule } from './compradores/compradores.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      autoLoadEntities: true,
      synchronize: true,
    }),
    UsuariosModule,
    AutenticacionModule,
    VendedoresModule,
    ZonasModule,
    CategoriasModule,
    ProductosModule,
    PedidosModule,
    PagosModule,
    CarritoModule,
    ResenasModule,
    ChatModule,
    AdminModule,
    CompradoresModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
