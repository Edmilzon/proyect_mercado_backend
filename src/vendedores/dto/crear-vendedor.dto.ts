import { IsNotEmpty, IsString, MaxLength, IsOptional, IsUUID, IsNumber } from 'class-validator';

export class CrearVendedorDto {
  @IsUUID()
  vendedor_id: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  numero_identificacion: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  estado_onboarding?: string;

  @IsOptional()
  @IsNumber()
  latitud_actual?: number;

  @IsOptional()
  @IsNumber()
  longitud_actual?: number;

  @IsOptional()
  @IsUUID()
  zona_asignada_id?: string;
} 