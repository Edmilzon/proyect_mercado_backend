import { IsNotEmpty, IsString, IsOptional, IsNumber, IsUrl, Min } from 'class-validator';

export class CrearImagenDto {
  @IsNotEmpty()
  @IsUrl()
  url_imagen: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  orden_indice?: number;
} 