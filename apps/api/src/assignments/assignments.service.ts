import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AssetAction, AssetStatus, Prisma } from '@prisma/client';
import { pageMeta, toPage } from '../common/pagination';
import { PrismaService } from '../prisma/prisma.service';
import { AssignmentQueryDto, CreateAssignmentDto, ReturnAssignmentDto } from './dto/assignment.dto';

const assignmentInclude = {
  asset: {
    select: {
      id: true,
      brand: true,
      model: true,
      serialNumber: true,
      type: true,
      status: true,
      qrCode: true,
      purchaseDate: true,
      warrantyExpiresAt: true,
      department: { select: { id: true, name: true } },
    },
  },
  user: {
    select: {
      id: true,
      fullName: true,
      email: true,
      department: { select: { id: true, name: true } },
    },
  },
  assignedBy: { select: { id: true, fullName: true } },
} satisfies Prisma.AssignmentInclude;

@Injectable()
export class AssignmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: AssignmentQueryDto) {
    const { page, limit, skip, take } = toPage(query);
    const where: Prisma.AssignmentWhereInput = {
      ...(query.assetId ? { assetId: query.assetId } : {}),
      ...(query.userId ? { userId: query.userId } : {}),
      ...(query.open === 'true' ? { returnedAt: null } : {}),
      ...(query.open === 'false' ? { returnedAt: { not: null } } : {}),
    };
    const [total, data] = await this.prisma.$transaction([
      this.prisma.assignment.count({ where }),
      this.prisma.assignment.findMany({
        where,
        include: assignmentInclude,
        orderBy: { assignedAt: 'desc' },
        skip,
        take,
      }),
    ]);
    return { data, meta: pageMeta(total, page, limit) };
  }

  async myAssets(userId: string) {
    const rows = await this.prisma.assignment.findMany({
      where: { userId, returnedAt: null },
      include: assignmentInclude,
      orderBy: { assignedAt: 'desc' },
    });
    return { data: rows };
  }

  async create(dto: CreateAssignmentDto, actorId: string) {
    const asset = await this.prisma.asset.findUnique({ where: { id: dto.assetId } });
    if (!asset) throw new NotFoundException('Cihaz bulunamadı');
    if (asset.status === AssetStatus.RETIRED) {
      throw new BadRequestException('Hurdaya ayrılmış cihaz zimmetlenemez');
    }
    if (asset.status === AssetStatus.FAULTY) {
      throw new BadRequestException('Arızalı cihaz zimmetlenemez');
    }
    if (asset.status === AssetStatus.ASSIGNED) {
      throw new BadRequestException('Cihazın açık zimmeti var');
    }
    const user = await this.prisma.user.findUnique({ where: { id: dto.userId } });
    if (!user || !user.isActive) {
      throw new BadRequestException('Personel bulunamadı veya pasif');
    }
    const note = dto.note?.trim() || null;
    try {
      return await this.prisma.$transaction(async (tx) => {
        const assignment = await tx.assignment.create({
          data: {
            assetId: asset.id,
            userId: user.id,
            assignedById: actorId,
            note,
          },
          include: assignmentInclude,
        });
        await tx.asset.update({
          where: { id: asset.id },
          data: { status: AssetStatus.ASSIGNED },
        });
        await tx.assetLog.create({
          data: {
            assetId: asset.id,
            actorId,
            action: AssetAction.ASSIGNED,
            fromStatus: asset.status,
            toStatus: AssetStatus.ASSIGNED,
            note,
          },
        });
        return assignment;
      });
    } catch (error) {
      if (
        typeof error === 'object' &&
        error &&
        'code' in error &&
        (error as { code?: string }).code === 'P2002'
      ) {
        throw new BadRequestException('Cihazın açık zimmeti var');
      }
      throw error;
    }
  }

  async returnOne(id: string, actorId: string, dto: ReturnAssignmentDto) {
    const assignment = await this.prisma.assignment.findUnique({
      where: { id },
      include: { asset: true },
    });
    if (!assignment) throw new NotFoundException('Zimmet kaydı bulunamadı');
    if (assignment.returnedAt) {
      throw new BadRequestException('Zimmet zaten kapatılmış');
    }
    const nextStatus =
      assignment.asset.status === AssetStatus.FAULTY ? AssetStatus.FAULTY : AssetStatus.IN_STOCK;
    const note = dto.note?.trim() || null;
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.assignment.update({
        where: { id },
        data: { returnedAt: new Date() },
        include: assignmentInclude,
      });
      await tx.asset.update({
        where: { id: assignment.assetId },
        data: { status: nextStatus },
      });
      await tx.assetLog.create({
        data: {
          assetId: assignment.assetId,
          actorId,
          action: AssetAction.RETURNED,
          fromStatus: assignment.asset.status,
          toStatus: nextStatus,
          note,
        },
      });
      return updated;
    });
  }
}
