import { IsNotEmpty, IsNumber, IsOptional, IsUUID } from 'class-validator';

export class CrearUbicacionDto {
  @IsUUID()
  vendedor_id: string;

  @IsOptional()
  @IsUUID()
  pedido_id?: string;

  @IsNotEmpty()
  @IsNumber()
  latitud: number;

  @IsNotEmpty()
  @IsNumber()
  longitud: number;

  @IsOptional()
  @IsNumber()
  precision_m?: number;
} 