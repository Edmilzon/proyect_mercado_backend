import { IsNotEmpty, IsUUID, IsOptional, IsString, IsNumber, IsArray, ValidateNested, Min, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class ItemPedidoDto {
  @IsNotEmpty()
  @IsUUID()
  producto_id: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  cantidad: number;
}

export class CrearPedidoDto {
  @IsNotEmpty()
  @IsUUID()
  comprador_id: string;

  @IsOptional()
  @IsUUID()
  vendedor_id?: string;

  @IsNotEmpty()
  @IsUUID()
  direccion_entrega_id: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  costo_envio?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  monto_descuento?: number;

  @IsOptional()
  @IsString()
  notas_comprador?: string;

  @IsOptional()
  @IsString()
  whatsapp_pedido_id?: string;

  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemPedidoDto)
  items: ItemPedidoDto[];
} 