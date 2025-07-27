import { IsNotEmpty, IsString, IsOptional, IsUUID, MaxLength } from 'class-validator';

export class ConvertirVendedorDto {
  @IsNotEmpty()
  @IsUUID()
  usuario_id: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  numero_identificacion: string; // CI, NIT, etc.

  @IsOptional()
  @IsString()
  @MaxLength(50)
  estado_onboarding?: string;

  @IsOptional()
  @IsUUID()
  zona_asignada_id?: string;
} 