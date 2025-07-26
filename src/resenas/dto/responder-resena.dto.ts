import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class ResponderResenaDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(1000)
  respuesta_vendedor: string;
} 