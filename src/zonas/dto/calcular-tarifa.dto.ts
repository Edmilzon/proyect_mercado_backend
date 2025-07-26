import { IsNotEmpty, IsNumber, IsOptional, IsUUID, Min, Max } from 'class-validator';

export class CalcularTarifaDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitud_origen: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitud_origen: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitud_destino: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitud_destino: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  peso_total_g?: number;

  @IsOptional()
  @IsUUID()
  zona_id?: string;
} 