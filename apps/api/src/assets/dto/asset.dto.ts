import { AssetStatus, AssetType } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { PaginationQueryDto } from '../../common/pagination';

export class CreateAssetDto {
  @IsString()
  @MinLength(1)
  brand!: string;

  @IsString()
  @MinLength(1)
  model!: string;

  @IsString()
  @MinLength(2, { message: 'Seri numarası en az 2 karakter olmalı' })
  serialNumber!: string;

  @IsEnum(AssetType, { message: 'Geçersiz cihaz türü' })
  type!: AssetType;

  @IsDateString({}, { message: 'Geçerli bir alım tarihi girin' })
  purchaseDate!: string;

  @IsOptional()
  @IsDateString({}, { message: 'Geçerli bir garanti tarihi girin' })
  warrantyExpiresAt?: string | null;

  @IsString()
  departmentId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string | null;
}

export class UpdateAssetDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  brand?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  model?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  serialNumber?: string;

  @IsOptional()
  @IsEnum(AssetType, { message: 'Geçersiz cihaz türü' })
  type?: AssetType;

  @IsOptional()
  @IsDateString()
  purchaseDate?: string;

  @IsOptional()
  @IsDateString()
  warrantyExpiresAt?: string | null;

  @IsOptional()
  @IsString()
  departmentId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string | null;

  @IsOptional()
  @IsEnum(AssetStatus, { message: 'Geçersiz durum' })
  status?: AssetStatus;
}

export class AssetQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(AssetStatus)
  status?: AssetStatus;

  @IsOptional()
  @IsEnum(AssetType)
  type?: AssetType;

  @IsOptional()
  @IsString()
  departmentId?: string;

  @IsOptional()
  @IsString()
  userId?: string;
}

export class FaultDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
