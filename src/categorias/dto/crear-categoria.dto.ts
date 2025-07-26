import { IsNotEmpty, IsString, IsOptional, IsUUID, MaxLength } from 'class-validator';

export class CrearCategoriaDto {
  @IsNotEmpty()
  @MaxLength(100)
  nombre: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsUUID()
  categoria_padre_id?: string;
} 