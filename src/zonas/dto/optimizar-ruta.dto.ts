import { IsNotEmpty, IsArray, IsUUID } from 'class-validator';

export class OptimizarRutaDto {
  @IsNotEmpty()
  @IsArray()
  @IsUUID('4', { each: true })
  pedidos_ids: string[];
} 