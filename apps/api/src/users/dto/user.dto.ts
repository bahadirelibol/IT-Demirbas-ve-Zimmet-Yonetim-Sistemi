import { Role } from '@prisma/client';
import { IsBoolean, IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { PaginationQueryDto } from '../../common/pagination';

export class CreateUserDto {
  @IsString()
  @MinLength(2, { message: 'Ad soyad en az 2 karakter olmalı' })
  fullName!: string;

  @IsEmail({}, { message: 'Geçerli bir e-posta girin' })
  email!: string;

  @IsString()
  @MinLength(8, { message: 'Şifre en az 8 karakter olmalı' })
  password!: string;

  @IsEnum(Role, { message: 'Geçersiz rol' })
  role!: Role;

  @IsString()
  departmentId!: string;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Ad soyad en az 2 karakter olmalı' })
  fullName?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Geçerli bir e-posta girin' })
  email?: string;

  @IsOptional()
  @IsEnum(Role, { message: 'Geçersiz rol' })
  role?: Role;

  @IsOptional()
  @IsString()
  departmentId?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class ResetPasswordDto {
  @IsString()
  @MinLength(8, { message: 'Şifre en az 8 karakter olmalı' })
  password!: string;
}

export class UserQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @IsOptional()
  @IsString()
  departmentId?: string;
}
