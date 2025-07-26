import { IsNotEmpty, IsUUID, IsNumber, Min } from 'class-validator';

export class ItemCarritoDto {
  @IsNotEmpty()
  @IsUUID()
  producto_id: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  cantidad: number;
} 