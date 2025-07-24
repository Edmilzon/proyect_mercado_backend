import { IsEmail, IsNotEmpty, IsString, MinLength, MaxLength, IsOptional, IsPhoneNumber } from 'class-validator';

export class CrearUsuarioDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(255)
  password: string;

  @IsNotEmpty()
  @MaxLength(100)
  nombre: string;

  @IsNotEmpty()
  @MaxLength(100)
  apellido: string;

  @IsNotEmpty()
  @MaxLength(20)
  numero_telefono: string;

  @IsOptional()
  @IsString()
  rol?: string;
} 