import { IsNotEmpty, IsUUID, IsString, IsOptional, IsUrl } from 'class-validator';

export class CrearMensajeDto {
  @IsNotEmpty()
  @IsUUID()
  conversacion_id: string;

  @IsNotEmpty()
  @IsString()
  contenido: string;

  @IsOptional()
  @IsString()
  tipo_mensaje?: string = 'texto';

  @IsOptional()
  @IsUrl()
  url_archivo?: string;
} 