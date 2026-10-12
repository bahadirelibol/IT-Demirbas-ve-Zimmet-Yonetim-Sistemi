import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AssetAction, AssetStatus, Prisma } from '@prisma/client';
import { randomBytes } from 'crypto';
import QRCode from 'qrcode';
import { AuthUser } from '../common/current-user.decorator';
import { pageMeta, toPage } from '../common/pagination';
import { rethrowPrisma } from '../common/prisma-error';
import { PrismaService } from '../prisma/prisma.service';
import { AssetQueryDto, CreateAssetDto, FaultDto, UpdateAssetDto } from './dto/asset.dto';

const listInclude = {
  department: { select: { id: true, name: true } },
  assignments: {
    where: { returnedAt: null },
    take: 1,
    include: {
      user: { select: { id: true, fullName: true, email: true } },
    },
  },
} satisfies Prisma.AssetInclude;

const detailInclude = {
  department: { select: { id: true, name: true } },
  assignments: {
    orderBy: { assignedAt: 'desc' as const },
    include: {
      user: { select: { id: true, fullName: true, email: true, department: { select: { name: true } } } },
      assignedBy: { select: { id: true, fullName: true } },
    },
  },
  logs: {
    orderBy: { createdAt: 'desc' as const },
    include: { actor: { select: { id: true, fullName: true } } },
  },
} satisfies Prisma.AssetInclude;

@Injectable()
export class AssetsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: AssetQueryDto) {
    const { page, limit, skip, take } = toPage(query);
    const search = query.search?.trim();
    const where: Prisma.AssetWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.type ? { type: query.type } : {}),
      ...(query.departmentId ? { departmentId: query.departmentId } : {}),
      ...(query.userId
        ? { assignments: { some: { userId: query.userId, returnedAt: null } } }
        : {}),
      ...(search
        ? {
            OR: [
              { brand: { contains: search, mode: 'insensitive' } },
              { model: { contains: search, mode: 'insensitive' } },
              { serialNumber: { contains: search, mode: 'insensitive' } },
              { qrCode: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const [total, rows] = await this.prisma.$transaction([
      this.prisma.asset.count({ where }),
      this.prisma.asset.findMany({
        where,
        include: listInclude,
        orderBy: { updatedAt: 'desc' },
        skip,
        take,
      }),
    ]);
    return {
      data: rows.map((asset) => this.toListItem(asset)),
      meta: pageMeta(total, page, limit),
    };
  }

  async detail(id: string) {
    const asset = await this.prisma.asset.findUnique({ where: { id }, include: detailInclude });
    if (!asset) throw new NotFoundException('Cihaz bulunamadı');
    return this.withQr(asset);
  }

  async byCode(qrCode: string) {
    const asset = await this.prisma.asset.findUnique({
      where: { qrCode: qrCode.trim() },
      include: detailInclude,
    });
    if (!asset) throw new NotFoundException('QR koduna ait cihaz bulunamadı');
    return this.withQr(asset);
  }

  async create(dto: CreateAssetDto, actorId: string) {
    await this.ensureDepartment(dto.departmentId);
    const qrCode = await this.uniqueQr();
    try {
      const asset = await this.prisma.asset.create({
        data: {
          brand: dto.brand.trim(),
          model: dto.model.trim(),
          serialNumber: dto.serialNumber.trim(),
          type: dto.type,
          purchaseDate: new Date(dto.purchaseDate),
          warrantyExpiresAt: dto.warrantyExpiresAt ? new Date(dto.warrantyExpiresAt) : null,
          departmentId: dto.departmentId,
          notes: dto.notes?.trim() || null,
          qrCode,
          status: AssetStatus.IN_STOCK,
          logs: {
            create: {
              actorId,
              action: AssetAction.CREATED,
              toStatus: AssetStatus.IN_STOCK,
            },
          },
        },
        include: detailInclude,
      });
      return this.withQr(asset);
    } catch (error) {
      rethrowPrisma(error);
    }
  }

  async update(id: string, dto: UpdateAssetDto, actorId: string) {
    const existing = await this.prisma.asset.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Cihaz bulunamadı');
    if (dto.departmentId) await this.ensureDepartment(dto.departmentId);
    if (dto.status) this.assertStatusChange(existing.status, dto.status);

    if (
      dto.status &&
      (dto.status === AssetStatus.IN_STOCK || dto.status === AssetStatus.RETIRED) &&
      existing.status === AssetStatus.ASSIGNED
    ) {
      throw new BadRequestException('Zimmetli cihazın durumunu değiştirmeden önce zimmeti kapatın');
    }

    const open = await this.prisma.assignment.findFirst({
      where: { assetId: id, returnedAt: null },
    });
    if (open && (dto.status === AssetStatus.IN_STOCK || dto.status === AssetStatus.RETIRED)) {
      throw new BadRequestException('Açık zimmet varken cihaz depoya veya hurdaya alınamaz');
    }

    try {
      const asset = await this.prisma.asset.update({
        where: { id },
        data: {
          ...(dto.brand !== undefined ? { brand: dto.brand.trim() } : {}),
          ...(dto.model !== undefined ? { model: dto.model.trim() } : {}),
          ...(dto.serialNumber !== undefined ? { serialNumber: dto.serialNumber.trim() } : {}),
          ...(dto.type !== undefined ? { type: dto.type } : {}),
          ...(dto.purchaseDate !== undefined ? { purchaseDate: new Date(dto.purchaseDate) } : {}),
          ...(dto.warrantyExpiresAt !== undefined
            ? { warrantyExpiresAt: dto.warrantyExpiresAt ? new Date(dto.warrantyExpiresAt) : null }
            : {}),
          ...(dto.departmentId !== undefined ? { departmentId: dto.departmentId } : {}),
          ...(dto.notes !== undefined ? { notes: dto.notes?.trim() || null } : {}),
          ...(dto.status !== undefined ? { status: dto.status } : {}),
          logs: {
            create: {
              actorId,
              action: dto.status === AssetStatus.FAULTY ? AssetAction.FAULT_REPORTED : AssetAction.UPDATED,
              fromStatus: existing.status,
              toStatus: dto.status ?? existing.status,
            },
          },
        },
        include: detailInclude,
      });
      return this.withQr(asset);
    } catch (error) {
      rethrowPrisma(error);
    }
  }

  async remove(id: string) {
    const existing = await this.prisma.asset.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Cihaz bulunamadı');
    await this.prisma.asset.delete({ where: { id } });
    return { ok: true };
  }

  async reportFault(id: string, actor: AuthUser, dto: FaultDto) {
    const existing = await this.prisma.asset.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Cihaz bulunamadı');
    if (existing.status === AssetStatus.RETIRED) {
      throw new BadRequestException('Hurdaya ayrılmış cihaz için arıza bildirilemez');
    }
    if (actor.role !== 'ADMIN') {
      const owns = await this.prisma.assignment.findFirst({
        where: { assetId: id, userId: actor.id, returnedAt: null },
      });
      if (!owns) {
        throw new ForbiddenException('Yalnızca kendi zimmetinizdeki cihaz için arıza bildirebilirsiniz');
      }
    }
    const asset = await this.prisma.asset.update({
      where: { id },
      data: {
        status: AssetStatus.FAULTY,
        logs: {
          create: {
            actorId: actor.id,
            action: AssetAction.FAULT_REPORTED,
            fromStatus: existing.status,
            toStatus: AssetStatus.FAULTY,
            note: dto.note?.trim() || null,
          },
        },
      },
      include: detailInclude,
    });
    return this.withQr(asset);
  }

  async qrPng(id: string) {
    const asset = await this.prisma.asset.findUnique({ where: { id } });
    if (!asset) throw new NotFoundException('Cihaz bulunamadı');
    return QRCode.toBuffer(asset.qrCode, { type: 'png', width: 480, margin: 1 });
  }

  private assertStatusChange(current: AssetStatus, next: AssetStatus) {
    if (next === AssetStatus.ASSIGNED && current !== AssetStatus.ASSIGNED) {
      throw new BadRequestException('Zimmet durumu yalnızca teslim işlemiyle verilir');
    }
  }

  private async ensureDepartment(id: string) {
    const department = await this.prisma.department.findUnique({ where: { id } });
    if (!department) throw new BadRequestException('Departman bulunamadı');
  }

  private async uniqueQr() {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const qrCode = `IT-${randomBytes(4).toString('hex').toUpperCase()}`;
      const exists = await this.prisma.asset.findUnique({ where: { qrCode } });
      if (!exists) return qrCode;
    }
    throw new BadRequestException('QR kod üretilemedi');
  }

  private toListItem(asset: Prisma.AssetGetPayload<{ include: typeof listInclude }>) {
    const { assignments, ...rest } = asset;
    return { ...rest, currentHolder: assignments[0]?.user ?? null };
  }

  private async withQr<T extends { qrCode: string }>(asset: T) {
    const qrDataUrl = await QRCode.toDataURL(asset.qrCode, { margin: 1, width: 320 });
    return { ...asset, qrDataUrl };
  }
}
