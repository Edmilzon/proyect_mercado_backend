import { IsNotEmpty, IsString, IsOptional, IsUUID, IsNumber, IsBoolean, MaxLength, Min, IsUrl } from 'class-validator';

export class CrearProductoDto {
  @IsNotEmpty()
  @MaxLength(255)
  nombre: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  precio_base: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  precio_actual: number;

  @IsNotEmpty()
  @IsUUID()
  categoria_id: string;

  @IsNotEmpty()
  @IsUUID()
  vendedor_id: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  cantidad_stock?: number;

  @IsOptional()
  @IsUrl()
  url_imagen_principal?: string;

  @IsOptional()
  @IsBoolean()
  esta_activo?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  sku?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  peso_g?: number;
} 