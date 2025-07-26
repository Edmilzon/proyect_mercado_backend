import { IsOptional, IsString, IsNumber, IsUUID, IsBoolean, Min, Max } from 'class-validator';

export class BuscarProductoDto {
  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsUUID()
  categoria_id?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  precio_min?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  precio_max?: number;

  @IsOptional()
  @IsBoolean()
  esta_activo?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsNumber()
  @Min(0)
  offset?: number = 0;
} 