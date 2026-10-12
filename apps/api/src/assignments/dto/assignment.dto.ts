import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../common/pagination';

export class CreateAssignmentDto {
  @IsString()
  assetId!: string;

  @IsString()
  userId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

export class ReturnAssignmentDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

export class AssignmentQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  assetId?: string;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsIn(['true', 'false'])
  open?: string;
}
