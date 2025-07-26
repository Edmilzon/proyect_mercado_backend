import { IsNotEmpty, IsUUID, IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class CrearPagoDto {
  @IsNotEmpty()
  @IsUUID()
  pedido_id: string;

  @IsNotEmpty()
  @IsString()
  transaccion_id: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  monto: number;

  @IsOptional()
  @IsString()
  moneda?: string;

  @IsNotEmpty()
  @IsString()
  metodo_pago: string;

  @IsOptional()
  @IsString()
  estado?: string;

  @IsOptional()
  @IsString()
  procesado_por?: string;

  @IsOptional()
  @IsString()
  notas?: string;
} 