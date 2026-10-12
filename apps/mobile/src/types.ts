export type Role = 'ADMIN' | 'PERSONEL';

export type SessionUser = {
  id: string;
  fullName: string;
  email: string;
  role: Role;
};

export type Person = { id: string; fullName: string; email: string };

export type Assignment = {
  id: string;
  returnedAt: string | null;
  note: string | null;
  assignedAt: string;
  user: Person;
  asset?: AssetSummary;
};

export type AssetSummary = {
  id: string;
  brand: string;
  model: string;
  serialNumber: string;
  type: string;
  status: string;
  qrCode: string;
  purchaseDate: string;
  warrantyExpiresAt: string | null;
  department: { name: string };
};

export type AssetDetail = AssetSummary & {
  notes: string | null;
  qrDataUrl: string;
  assignments: Assignment[];
};

export const statusLabels: Record<string, string> = {
  IN_STOCK: 'Depoda',
  ASSIGNED: 'Zimmetli',
  FAULTY: 'Arızalı',
  RETIRED: 'Hurda',
};

export const typeLabels: Record<string, string> = {
  COMPUTER: 'Bilgisayar',
  SERVER: 'Sunucu',
  MONITOR: 'Monitör',
  OTHER: 'Diğer',
};

export function formatDate(value?: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('tr-TR');
}
