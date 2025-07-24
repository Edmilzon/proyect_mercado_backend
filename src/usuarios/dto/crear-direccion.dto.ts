import { IsNotEmpty, IsOptional, IsString, IsNumber, IsBoolean, MaxLength } from 'class-validator';

export class CrearDireccionDto {
  @IsOptional()
  @IsString()
  etiqueta?: string;

  @IsNotEmpty()
  @MaxLength(255)
  calle_avenida: string;

  @IsNotEmpty()
  @MaxLength(100)
  ciudad: string;

  @IsNotEmpty()
  @MaxLength(100)
  departamento: string;

  @IsOptional()
  @MaxLength(20)
  codigo_postal?: string;

  @IsNotEmpty()
  @MaxLength(100)
  pais: string;

  @IsNotEmpty()
  @IsNumber()
  latitud: number;

  @IsNotEmpty()
  @IsNumber()
  longitud: number;

  @IsOptional()
  @IsBoolean()
  es_predeterminada?: boolean;
} 