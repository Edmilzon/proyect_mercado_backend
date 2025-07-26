import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Producto } from '../productos/producto.entity';
import { ItemCarritoDto } from './dto/item-carrito.dto';

@Injectable()
export class CarritoService {
  constructor(
    @InjectRepository(Producto)
    private readonly productoRepositorio: Repository<Producto>,
  ) {}

  async calcularCarrito(items: ItemCarritoDto[]): Promise<{
    items: Array<ItemCarritoDto & { 
      producto: Producto; 
      precio_unitario: number; 
      subtotal: number; 
      disponible: boolean;
      stock_disponible: number;
    }>;
    subtotal: number;
    total_items: number;
  }> {
    let subtotal = 0;
    let total_items = 0;
    const itemsCalculados: Array<ItemCarritoDto & { 
      producto: Producto; 
      precio_unitario: number; 
      subtotal: number; 
      disponible: boolean;
      stock_disponible: number;
    }> = [];

    for (const item of items) {
      const producto = await this.productoRepositorio.findOne({ 
        where: { producto_id: item.producto_id },
        relations: ['categoria']
      });

      if (!producto) {
        throw new BadRequestException(`Producto ${item.producto_id} no encontrado`);
      }

      const disponible = producto.esta_activo && producto.cantidad_stock >= item.cantidad;
      const precio_unitario = producto.precio_actual;
      const subtotal_item = precio_unitario * item.cantidad;

      itemsCalculados.push({
        ...item,
        producto,
        precio_unitario,
        subtotal: subtotal_item,
        disponible,
        stock_disponible: producto.cantidad_stock,
      });

      if (disponible) {
        subtotal += subtotal_item;
        total_items += item.cantidad;
      }
    }

    return {
      items: itemsCalculados,
      subtotal,
      total_items,
    };
  }

  async validarStock(items: ItemCarritoDto[]): Promise<{
    valido: boolean;
    errores: string[];
  }> {
    const errores: string[] = [];

    for (const item of items) {
      const producto = await this.productoRepositorio.findOne({ 
        where: { producto_id: item.producto_id } 
      });

      if (!producto) {
        errores.push(`Producto ${item.producto_id} no encontrado`);
        continue;
      }

      if (!producto.esta_activo) {
        errores.push(`Producto ${producto.nombre} no está disponible`);
        continue;
      }

      if (producto.cantidad_stock < item.cantidad) {
        errores.push(`Stock insuficiente para ${producto.nombre}. Disponible: ${producto.cantidad_stock}, Solicitado: ${item.cantidad}`);
      }
    }

    return {
      valido: errores.length === 0,
      errores,
    };
  }

  async calcularEnvio(subtotal: number, zona_id?: string): Promise<{
    costo_envio: number;
    zona_nombre?: string;
  }> {
    // Lógica simplificada para calcular envío
    // En una implementación real, esto consultaría la tabla zonas_entrega
    let costo_envio = 0;
    
    if (subtotal < 100) {
      costo_envio = 15; // Envío estándar
    } else if (subtotal < 200) {
      costo_envio = 10; // Envío reducido
    } else {
      costo_envio = 0; // Envío gratis
    }

    return {
      costo_envio,
      zona_nombre: zona_id ? 'Zona estándar' : undefined,
    };
  }

  async calcularDescuentos(subtotal: number, codigo_descuento?: string): Promise<{
    monto_descuento: number;
    porcentaje_descuento: number;
    codigo_aplicado?: string;
  }> {
    // Lógica simplificada para descuentos
    let monto_descuento = 0;
    let porcentaje_descuento = 0;
    let codigo_aplicado: string | undefined = undefined;

    if (codigo_descuento) {
      // Simular validación de código de descuento
      if (codigo_descuento === 'DESCUENTO10') {
        porcentaje_descuento = 10;
        monto_descuento = (subtotal * porcentaje_descuento) / 100;
        codigo_aplicado = codigo_descuento;
      } else if (codigo_descuento === 'DESCUENTO20') {
        porcentaje_descuento = 20;
        monto_descuento = (subtotal * porcentaje_descuento) / 100;
        codigo_aplicado = codigo_descuento;
      }
    }

    return {
      monto_descuento,
      porcentaje_descuento,
      codigo_aplicado,
    };
  }
} 