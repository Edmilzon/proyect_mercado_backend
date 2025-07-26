import { IsNotEmpty, IsString, IsOptional, IsDateString } from 'class-validator';

export class ActualizarEstadoDto {
  @IsNotEmpty()
  @IsString()
  estado: string;

  @IsOptional()
  @IsString()
  notas_vendedor?: string;

  @IsOptional()
  @IsDateString()
  hora_estimada_entrega?: string;

  @IsOptional()
  @IsDateString()
  hora_real_entrega?: string;
} 