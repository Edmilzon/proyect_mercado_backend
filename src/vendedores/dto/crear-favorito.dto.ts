import { IsNotEmpty, IsUUID } from 'class-validator';

export class CrearFavoritoDto {
  @IsNotEmpty()
  @IsUUID()
  usuario_id: string;

  @IsNotEmpty()
  @IsUUID()
  producto_id: string;
} 