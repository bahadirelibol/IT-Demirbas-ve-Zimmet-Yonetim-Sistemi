import { Injectable } from '@nestjs/common';
import { AssetStatus, AssetType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async stats() {
    const [total, faulty, inStock, assigned, retired, byType, recentLogs] = await Promise.all([
      this.prisma.asset.count(),
      this.prisma.asset.count({ where: { status: AssetStatus.FAULTY } }),
      this.prisma.asset.count({ where: { status: AssetStatus.IN_STOCK } }),
      this.prisma.asset.count({ where: { status: AssetStatus.ASSIGNED } }),
      this.prisma.asset.count({ where: { status: AssetStatus.RETIRED } }),
      this.prisma.asset.groupBy({ by: ['type'], _count: { _all: true } }),
      this.prisma.assetLog.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
        include: {
          actor: { select: { fullName: true } },
          asset: { select: { id: true, brand: true, model: true, qrCode: true } },
        },
      }),
    ]);

    const typeCounts = Object.values(AssetType).map((type) => ({
      type,
      count: byType.find((row) => row.type === type)?._count._all ?? 0,
    }));

    return { total, faulty, inStock, assigned, retired, typeCounts, recentLogs };
  }
}
