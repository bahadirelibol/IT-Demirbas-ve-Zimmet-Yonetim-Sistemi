import { IsString, MinLength } from 'class-validator';

export class DepartmentDto {
  @IsString()
  @MinLength(2, { message: 'Departman adı en az 2 karakter olmalı' })
  name!: string;
}
