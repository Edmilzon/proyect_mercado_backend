import { IsOptional, IsUUID, IsString, IsNumber, Min, Max } from 'class-validator';

export class BuscarConversacionDto {
  @IsOptional()
  @IsUUID()
  pedido_id?: string;

  @IsOptional()
  @IsString()
  tipo_conversacion?: string;

  @IsOptional()
  @IsString()
  estado?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsNumber()
  @Min(0)
  offset?: number = 0;
} 