import { IsNotEmpty, IsUUID, IsNumber, IsOptional, IsString, Min, Max } from 'class-validator';

export class CrearResenaDto {
  @IsNotEmpty()
  @IsUUID()
  pedido_id: string;

  @IsNotEmpty()
  @IsUUID()
  comprador_id: string;

  @IsNotEmpty()
  @IsUUID()
  vendedor_id: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  @Max(5)
  calificacion: number;

  @IsOptional()
  @IsString()
  comentario?: string;
} 