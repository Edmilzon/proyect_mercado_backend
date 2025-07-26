import { IsNotEmpty, IsString, IsOptional, IsNumber, IsBoolean, MaxLength } from 'class-validator';

export class CrearZonaDto {
  @IsNotEmpty()
  @MaxLength(100)
  nombre: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsNotEmpty()
  @IsString()
  coordenadas_poligono: string;

  @IsOptional()
  @IsNumber()
  tarifa_envio?: number;

  @IsOptional()
  @IsBoolean()
  esta_activa?: boolean;
} 