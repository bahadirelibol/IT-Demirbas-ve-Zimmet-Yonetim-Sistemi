import {
  AssetAction,
  AssetStatus,
  AssetType,
  PrismaClient,
  Role,
} from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash('Admin123!', 10);
  const staffPassword = await bcrypt.hash('Personel123!', 10);

  const bilgi = await prisma.department.upsert({
    where: { name: 'Bilgi İşlem' },
    update: {},
    create: { name: 'Bilgi İşlem' },
  });
  const ik = await prisma.department.upsert({
    where: { name: 'İnsan Kaynakları' },
    update: {},
    create: { name: 'İnsan Kaynakları' },
  });
  const muhasebe = await prisma.department.upsert({
    where: { name: 'Muhasebe' },
    update: {},
    create: { name: 'Muhasebe' },
  });
  const operasyon = await prisma.department.upsert({
    where: { name: 'Operasyon' },
    update: {},
    create: { name: 'Operasyon' },
  });

  const admin = await prisma.user.upsert({
    where: { email: 'admin@kurum.local' },
    update: {},
    create: {
      fullName: 'Sistem Yöneticisi',
      email: 'admin@kurum.local',
      passwordHash: adminPassword,
      role: Role.ADMIN,
      departmentId: bilgi.id,
    },
  });
  const ayse = await prisma.user.upsert({
    where: { email: 'ayse.yilmaz@kurum.local' },
    update: {},
    create: {
      fullName: 'Ayşe Yılmaz',
      email: 'ayse.yilmaz@kurum.local',
      passwordHash: staffPassword,
      role: Role.PERSONEL,
      departmentId: ik.id,
    },
  });
  const mehmet = await prisma.user.upsert({
    where: { email: 'mehmet.demir@kurum.local' },
    update: {},
    create: {
      fullName: 'Mehmet Demir',
      email: 'mehmet.demir@kurum.local',
      passwordHash: staffPassword,
      role: Role.PERSONEL,
      departmentId: muhasebe.id,
    },
  });
  const zeynep = await prisma.user.upsert({
    where: { email: 'zeynep.kaya@kurum.local' },
    update: {},
    create: {
      fullName: 'Zeynep Kaya',
      email: 'zeynep.kaya@kurum.local',
      passwordHash: staffPassword,
      role: Role.PERSONEL,
      departmentId: operasyon.id,
    },
  });

  const assets = [
    {
      serialNumber: 'SN-LAT-5540-001',
      brand: 'Dell',
      model: 'Latitude 5540',
      type: AssetType.COMPUTER,
      purchaseDate: new Date('2024-03-12T00:00:00.000Z'),
      warrantyExpiresAt: new Date('2027-03-12T00:00:00.000Z'),
      status: AssetStatus.ASSIGNED,
      qrCode: 'IT-LAP-0001',
      departmentId: ik.id,
      notes: 'İnsan kaynakları saha dizüstüsü',
    },
    {
      serialNumber: 'SN-TP-E14-014',
      brand: 'Lenovo',
      model: 'ThinkPad E14',
      type: AssetType.COMPUTER,
      purchaseDate: new Date('2023-11-02T00:00:00.000Z'),
      warrantyExpiresAt: new Date('2026-11-02T00:00:00.000Z'),
      status: AssetStatus.ASSIGNED,
      qrCode: 'IT-LAP-0002',
      departmentId: muhasebe.id,
      notes: null,
    },
    {
      serialNumber: 'SN-HP-450-088',
      brand: 'HP',
      model: 'ProBook 450 G10',
      type: AssetType.COMPUTER,
      purchaseDate: new Date('2024-06-20T00:00:00.000Z'),
      warrantyExpiresAt: new Date('2027-06-20T00:00:00.000Z'),
      status: AssetStatus.FAULTY,
      qrCode: 'IT-LAP-0003',
      departmentId: operasyon.id,
      notes: 'Klavye arızası bildirildi',
    },
    {
      serialNumber: 'SN-LAT-5440-210',
      brand: 'Dell',
      model: 'Latitude 5440',
      type: AssetType.COMPUTER,
      purchaseDate: new Date('2022-09-01T00:00:00.000Z'),
      warrantyExpiresAt: new Date('2025-09-01T00:00:00.000Z'),
      status: AssetStatus.IN_STOCK,
      qrCode: 'IT-LAP-0004',
      departmentId: bilgi.id,
      notes: 'İade sonrası depoya alındı',
    },
    {
      serialNumber: 'SN-TC-M70-011',
      brand: 'Lenovo',
      model: 'ThinkCentre M70q',
      type: AssetType.COMPUTER,
      purchaseDate: new Date('2025-01-15T00:00:00.000Z'),
      warrantyExpiresAt: new Date('2028-01-15T00:00:00.000Z'),
      status: AssetStatus.IN_STOCK,
      qrCode: 'IT-PC-0005',
      departmentId: bilgi.id,
      notes: null,
    },
    {
      serialNumber: 'SN-PE-R750-001',
      brand: 'Dell',
      model: 'PowerEdge R750',
      type: AssetType.SERVER,
      purchaseDate: new Date('2023-04-18T00:00:00.000Z'),
      warrantyExpiresAt: new Date('2028-04-18T00:00:00.000Z'),
      status: AssetStatus.ASSIGNED,
      qrCode: 'IT-SRV-0001',
      departmentId: bilgi.id,
      notes: 'Uygulama sunucusu',
    },
    {
      serialNumber: 'SN-DL380-002',
      brand: 'HPE',
      model: 'ProLiant DL380 Gen11',
      type: AssetType.SERVER,
      purchaseDate: new Date('2024-02-08T00:00:00.000Z'),
      warrantyExpiresAt: new Date('2029-02-08T00:00:00.000Z'),
      status: AssetStatus.FAULTY,
      qrCode: 'IT-SRV-0002',
      departmentId: bilgi.id,
      notes: 'Disk hatası, depoda bekliyor',
    },
    {
      serialNumber: 'SN-P2422-101',
      brand: 'Dell',
      model: 'P2422H',
      type: AssetType.MONITOR,
      purchaseDate: new Date('2024-03-12T00:00:00.000Z'),
      warrantyExpiresAt: new Date('2027-03-12T00:00:00.000Z'),
      status: AssetStatus.ASSIGNED,
      qrCode: 'IT-MON-0001',
      departmentId: ik.id,
      notes: null,
    },
    {
      serialNumber: 'SN-LG27-220',
      brand: 'LG',
      model: '27UP850',
      type: AssetType.MONITOR,
      purchaseDate: new Date('2023-11-02T00:00:00.000Z'),
      warrantyExpiresAt: new Date('2026-11-02T00:00:00.000Z'),
      status: AssetStatus.ASSIGNED,
      qrCode: 'IT-MON-0002',
      departmentId: muhasebe.id,
      notes: null,
    },
    {
      serialNumber: 'SN-S24-330',
      brand: 'Samsung',
      model: 'S24R350',
      type: AssetType.MONITOR,
      purchaseDate: new Date('2025-05-06T00:00:00.000Z'),
      warrantyExpiresAt: new Date('2028-05-06T00:00:00.000Z'),
      status: AssetStatus.IN_STOCK,
      qrCode: 'IT-MON-0003',
      departmentId: operasyon.id,
      notes: null,
    },
    {
      serialNumber: 'SN-P2422-118',
      brand: 'Dell',
      model: 'P2422H',
      type: AssetType.MONITOR,
      purchaseDate: new Date('2019-01-20T00:00:00.000Z'),
      warrantyExpiresAt: new Date('2022-01-20T00:00:00.000Z'),
      status: AssetStatus.RETIRED,
      qrCode: 'IT-MON-0004',
      departmentId: bilgi.id,
      notes: 'Panel hasarlı, hurdaya ayrıldı',
    },
    {
      serialNumber: 'SN-LJ-400-009',
      brand: 'HP',
      model: 'LaserJet Pro 400',
      type: AssetType.OTHER,
      purchaseDate: new Date('2024-08-01T00:00:00.000Z'),
      warrantyExpiresAt: new Date('2026-08-01T00:00:00.000Z'),
      status: AssetStatus.IN_STOCK,
      qrCode: 'IT-PRN-0001',
      departmentId: muhasebe.id,
      notes: 'Kat yazıcısı',
    },
  ];

  const saved = new Map<string, { id: string }>();
  for (const asset of assets) {
    const row = await prisma.asset.upsert({
      where: { serialNumber: asset.serialNumber },
      update: {},
      create: asset,
    });
    saved.set(asset.qrCode, row);
  }

  const assignments = [
    {
      id: 'seed-asg-ayse-laptop',
      assetId: saved.get('IT-LAP-0001')!.id,
      userId: ayse.id,
      assignedAt: new Date('2024-03-15T08:30:00.000Z'),
      returnedAt: null,
      note: 'İşe giriş zimmeti',
    },
    {
      id: 'seed-asg-mehmet-laptop',
      assetId: saved.get('IT-LAP-0002')!.id,
      userId: mehmet.id,
      assignedAt: new Date('2023-11-06T09:00:00.000Z'),
      returnedAt: null,
      note: null,
    },
    {
      id: 'seed-asg-zeynep-laptop',
      assetId: saved.get('IT-LAP-0003')!.id,
      userId: zeynep.id,
      assignedAt: new Date('2024-06-21T10:15:00.000Z'),
      returnedAt: null,
      note: null,
    },
    {
      id: 'seed-asg-zeynep-old',
      assetId: saved.get('IT-LAP-0004')!.id,
      userId: zeynep.id,
      assignedAt: new Date('2023-02-01T08:00:00.000Z'),
      returnedAt: new Date('2025-09-12T16:00:00.000Z'),
      note: 'Görev değişikliği nedeniyle iade',
    },
    {
      id: 'seed-asg-admin-server',
      assetId: saved.get('IT-SRV-0001')!.id,
      userId: admin.id,
      assignedAt: new Date('2023-04-20T11:00:00.000Z'),
      returnedAt: null,
      note: 'Sistem odası sorumluluğu',
    },
    {
      id: 'seed-asg-ayse-monitor',
      assetId: saved.get('IT-MON-0001')!.id,
      userId: ayse.id,
      assignedAt: new Date('2024-03-15T08:40:00.000Z'),
      returnedAt: null,
      note: null,
    },
    {
      id: 'seed-asg-mehmet-monitor',
      assetId: saved.get('IT-MON-0002')!.id,
      userId: mehmet.id,
      assignedAt: new Date('2023-11-06T09:10:00.000Z'),
      returnedAt: null,
      note: null,
    },
  ];

  for (const assignment of assignments) {
    await prisma.assignment.upsert({
      where: { id: assignment.id },
      update: {},
      create: { ...assignment, assignedById: admin.id },
    });
  }

  const logs = [
    log('seed-log-1', 'IT-LAP-0001', AssetAction.CREATED, null, AssetStatus.IN_STOCK, '2024-03-12T07:00:00.000Z'),
    log('seed-log-2', 'IT-LAP-0001', AssetAction.ASSIGNED, AssetStatus.IN_STOCK, AssetStatus.ASSIGNED, '2024-03-15T08:30:00.000Z', 'İşe giriş zimmeti'),
    log('seed-log-3', 'IT-LAP-0003', AssetAction.CREATED, null, AssetStatus.IN_STOCK, '2024-06-20T07:00:00.000Z'),
    log('seed-log-4', 'IT-LAP-0003', AssetAction.ASSIGNED, AssetStatus.IN_STOCK, AssetStatus.ASSIGNED, '2024-06-21T10:15:00.000Z'),
    log('seed-log-5', 'IT-LAP-0003', AssetAction.FAULT_REPORTED, AssetStatus.ASSIGNED, AssetStatus.FAULTY, '2025-12-02T14:20:00.000Z', 'Klavye tepki vermiyor'),
    log('seed-log-6', 'IT-LAP-0004', AssetAction.RETURNED, AssetStatus.ASSIGNED, AssetStatus.IN_STOCK, '2025-09-12T16:00:00.000Z', 'Görev değişikliği nedeniyle iade'),
    log('seed-log-7', 'IT-SRV-0002', AssetAction.FAULT_REPORTED, AssetStatus.IN_STOCK, AssetStatus.FAULTY, '2026-01-09T09:40:00.000Z', 'Disk hatası'),
    log('seed-log-8', 'IT-MON-0004', AssetAction.UPDATED, AssetStatus.IN_STOCK, AssetStatus.RETIRED, '2025-04-03T13:00:00.000Z', 'Hurdaya ayrıldı'),
  ];

  for (const entry of logs) {
    await prisma.assetLog.upsert({
      where: { id: entry.id },
      update: {},
      create: {
        id: entry.id,
        assetId: saved.get(entry.qr)!.id,
        actorId: admin.id,
        action: entry.action,
        fromStatus: entry.fromStatus,
        toStatus: entry.toStatus,
        note: entry.note,
        createdAt: new Date(entry.at),
      },
    });
  }
}

function log(
  id: string,
  qr: string,
  action: AssetAction,
  fromStatus: AssetStatus | null,
  toStatus: AssetStatus,
  at: string,
  note?: string,
) {
  return { id, qr, action, fromStatus, toStatus, at, note: note ?? null };
}

main()
  .then(() => {
    console.log('Örnek veriler hazır');
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
