import { IsNotEmpty, IsUUID } from 'class-validator';

export class AsignarZonaDto {
  @IsNotEmpty()
  @IsUUID()
  zona_id: string;
} 