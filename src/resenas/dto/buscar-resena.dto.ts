import { IsOptional, IsUUID, IsNumber, Min, Max } from 'class-validator';

export class BuscarResenaDto {
  @IsOptional()
  @IsUUID()
  vendedor_id?: string;

  @IsOptional()
  @IsUUID()
  comprador_id?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  calificacion?: number;

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