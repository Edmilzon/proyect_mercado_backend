import { IsNotEmpty, IsString, IsOptional, IsUUID, MaxLength, IsEnum } from 'class-validator';

export enum EstadoValidacionVendedor {
  PENDIENTE = 'pendiente',
  APROBADO = 'aprobado',
  RECHAZADO = 'rechazado',
  SUSPENDIDO = 'suspendido'
}

export class ValidarVendedorDto {
  @IsNotEmpty()
  @IsUUID()
  vendedor_id: string;

  @IsNotEmpty()
  @IsEnum(EstadoValidacionVendedor)
  estado: EstadoValidacionVendedor;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  motivo_rechazo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notas_admin?: string;

  @IsOptional()
  @IsString()
  admin_id: string; // ID del admin que realiza la validación
} 