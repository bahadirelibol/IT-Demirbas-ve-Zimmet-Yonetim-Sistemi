import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { pageMeta, toPage } from '../common/pagination';
import { rethrowPrisma } from '../common/prisma-error';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto, ResetPasswordDto, UpdateUserDto, UserQueryDto } from './dto/user.dto';

const userSelect = {
  id: true,
  fullName: true,
  email: true,
  role: true,
  isActive: true,
  departmentId: true,
  createdAt: true,
  updatedAt: true,
  department: { select: { id: true, name: true } },
} satisfies Prisma.UserSelect;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: UserQueryDto) {
    const { page, limit, skip, take } = toPage(query);
    const search = query.search?.trim();
    const where: Prisma.UserWhereInput = {
      ...(query.role ? { role: query.role } : {}),
      ...(query.departmentId ? { departmentId: query.departmentId } : {}),
      ...(search
        ? {
            OR: [
              { fullName: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const [total, data] = await this.prisma.$transaction([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        select: userSelect,
        orderBy: { fullName: 'asc' },
        skip,
        take,
      }),
    ]);
    return { data, meta: pageMeta(total, page, limit) };
  }

  async lookup() {
    return this.prisma.user.findMany({
      where: { isActive: true },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        department: { select: { id: true, name: true } },
      },
      orderBy: { fullName: 'asc' },
    });
  }

  async create(dto: CreateUserDto) {
    await this.ensureDepartment(dto.departmentId);
    try {
      return await this.prisma.user.create({
        data: {
          fullName: dto.fullName.trim(),
          email: dto.email.toLowerCase(),
          passwordHash: await bcrypt.hash(dto.password, 10),
          role: dto.role,
          departmentId: dto.departmentId,
        },
        select: userSelect,
      });
    } catch (error) {
      rethrowPrisma(error);
    }
  }

  async update(id: string, dto: UpdateUserDto, actorId: string) {
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Kullanıcı bulunamadı');
    if (id === actorId && dto.isActive === false) {
      throw new BadRequestException('Kendi hesabınızı pasif yapamazsınız');
    }
    if (dto.departmentId) await this.ensureDepartment(dto.departmentId);
    try {
      return await this.prisma.user.update({
        where: { id },
        data: {
          ...(dto.fullName !== undefined ? { fullName: dto.fullName.trim() } : {}),
          ...(dto.email !== undefined ? { email: dto.email.toLowerCase() } : {}),
          ...(dto.role !== undefined ? { role: dto.role } : {}),
          ...(dto.departmentId !== undefined ? { departmentId: dto.departmentId } : {}),
          ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        },
        select: userSelect,
      });
    } catch (error) {
      rethrowPrisma(error);
    }
  }

  async resetPassword(id: string, dto: ResetPasswordDto) {
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Kullanıcı bulunamadı');
    await this.prisma.user.update({
      where: { id },
      data: { passwordHash: await bcrypt.hash(dto.password, 10) },
    });
    return { ok: true };
  }

  async remove(id: string, actorId: string) {
    if (id === actorId) {
      throw new BadRequestException('Kendi hesabınızı silemezsiniz');
    }
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Kullanıcı bulunamadı');
    const [assignments, logs] = await this.prisma.$transaction([
      this.prisma.assignment.count({
        where: { OR: [{ userId: id }, { assignedById: id }] },
      }),
      this.prisma.assetLog.count({ where: { actorId: id } }),
    ]);
    if (assignments > 0 || logs > 0) {
      throw new ConflictException(
        'Bu kullanıcının zimmet veya işlem geçmişi var. Hesabı pasif yapabilirsiniz',
      );
    }
    await this.prisma.user.delete({ where: { id } });
    return { ok: true };
  }

  private async ensureDepartment(id: string) {
    const department = await this.prisma.department.findUnique({ where: { id } });
    if (!department) throw new BadRequestException('Departman bulunamadı');
  }
}
