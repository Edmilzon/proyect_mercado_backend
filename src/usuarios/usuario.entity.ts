import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('usuarios')
@Index(['email'])
@Index(['rol'])
export class Usuario {
  @PrimaryGeneratedColumn('uuid')
  usuario_id: string;

  @Column({ unique: true, length: 255 })
  email: string;

  @Column({ name: 'password_hash', length: 255 })
  password_hash: string;

  @Column({ length: 100 })
  nombre: string;

  @Column({ length: 100 })
  apellido: string;

  @Column({ unique: true, length: 20 })
  numero_telefono: string;

  @Column({ length: 50, default: 'comprador' })
  rol: string;

  @Column({ default: true })
  esta_activo: boolean;

  @Column({ type: 'timestamp', nullable: true })
  ultima_sesion_at: Date;

  @CreateDateColumn({ name: 'creado_at' })
  creado_at: Date;

  @UpdateDateColumn({ name: 'actualizado_at' })
  actualizado_at: Date;
} 