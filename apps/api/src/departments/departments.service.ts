import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { rethrowPrisma } from '../common/prisma-error';
import { PrismaService } from '../prisma/prisma.service';
import { DepartmentDto } from './dto/department.dto';

@Injectable()
export class DepartmentsService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.department.findMany({ orderBy: { name: 'asc' } });
  }

  async create(dto: DepartmentDto) {
    try {
      return await this.prisma.department.create({ data: { name: dto.name.trim() } });
    } catch (error) {
      rethrowPrisma(error);
    }
  }

  async update(id: string, dto: DepartmentDto) {
    const existing = await this.prisma.department.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Departman bulunamadı');
    try {
      return await this.prisma.department.update({
        where: { id },
        data: { name: dto.name.trim() },
      });
    } catch (error) {
      rethrowPrisma(error);
    }
  }

  async remove(id: string) {
    const existing = await this.prisma.department.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Departman bulunamadı');
    const [users, assets] = await this.prisma.$transaction([
      this.prisma.user.count({ where: { departmentId: id } }),
      this.prisma.asset.count({ where: { departmentId: id } }),
    ]);
    if (users > 0 || assets > 0) {
      throw new ConflictException('Bu departmana bağlı kullanıcı veya cihaz var');
    }
    await this.prisma.department.delete({ where: { id } });
    return { ok: true };
  }
}
