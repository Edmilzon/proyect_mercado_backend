import { IsNotEmpty, IsString, IsOptional, IsNumber, IsDateString, MaxLength, Min, Max } from 'class-validator';

export class CrearCodigoDescuentoDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  codigo: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  descripcion: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(100)
  porcentaje_descuento: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  monto_minimo?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  monto_maximo_descuento?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  usos_maximos?: number;

  @IsOptional()
  @IsDateString()
  fecha_inicio?: string;

  @IsOptional()
  @IsDateString()
  fecha_fin?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  categoria_id?: string; // Descuento específico para categoría
} 