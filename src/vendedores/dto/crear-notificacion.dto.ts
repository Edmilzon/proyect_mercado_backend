import { IsNotEmpty, IsString, IsOptional, IsUUID, MaxLength, IsEnum } from 'class-validator';

export enum TipoNotificacion {
  PEDIDO_NUEVO = 'pedido_nuevo',
  PEDIDO_ACTUALIZADO = 'pedido_actualizado',
  MENSAJE_NUEVO = 'mensaje_nuevo',
  RESENA_NUEVA = 'resena_nueva',
  PRODUCTO_APROBADO = 'producto_aprobado',
  PRODUCTO_RECHAZADO = 'producto_rechazado',
  VENDEDOR_APROBADO = 'vendedor_aprobado',
  VENDEDOR_RECHAZADO = 'vendedor_rechazado',
  SISTEMA = 'sistema'
}

export class CrearNotificacionDto {
  @IsNotEmpty()
  @IsUUID()
  usuario_id: string;

  @IsNotEmpty()
  @IsEnum(TipoNotificacion)
  tipo: TipoNotificacion;

  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  titulo: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(1000)
  mensaje: string;

  @IsOptional()
  @IsUUID()
  entidad_id?: string; // ID del pedido, producto, etc.

  @IsOptional()
  @IsString()
  @MaxLength(255)
  url_redireccion?: string;
} 