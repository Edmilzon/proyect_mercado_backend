import { IsNotEmpty, IsUUID, IsOptional, IsString, IsArray } from 'class-validator';

export class CrearConversacionDto {
  @IsOptional()
  @IsUUID()
  pedido_id?: string;

  @IsOptional()
  @IsString()
  tipo_conversacion?: string = 'directa';

  @IsNotEmpty()
  @IsArray()
  @IsUUID('4', { each: true })
  participantes: string[];
} 