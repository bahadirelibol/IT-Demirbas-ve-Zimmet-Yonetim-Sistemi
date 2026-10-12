import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 10;

  @IsOptional()
  @IsString()
  search?: string;
}

export function toPage(query: PaginationQueryDto) {
  const page = query.page || 1;
  const limit = query.limit || 10;
  return { page, limit, skip: (page - 1) * limit, take: limit };
}

export function pageMeta(total: number, page: number, limit: number) {
  return {
    total,
    page,
    limit,
    pageCount: Math.max(1, Math.ceil(total / limit)),
  };
}
