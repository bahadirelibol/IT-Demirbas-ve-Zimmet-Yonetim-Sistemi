export type Role = 'ADMIN' | 'PERSONEL';
export type AssetStatus = 'IN_STOCK' | 'ASSIGNED' | 'FAULTY' | 'RETIRED';
export type AssetType = 'COMPUTER' | 'SERVER' | 'MONITOR' | 'OTHER';

export type Department = { id: string; name: string };

export type User = {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  isActive: boolean;
  departmentId: string;
  department?: Department;
};

export type PageMeta = { total: number; page: number; limit: number; pageCount: number };

export type AssetListItem = {
  id: string;
  brand: string;
  model: string;
  serialNumber: string;
  type: AssetType;
  purchaseDate: string;
  warrantyExpiresAt: string | null;
  status: AssetStatus;
  qrCode: string;
  notes: string | null;
  department: Department;
  currentHolder: { id: string; fullName: string; email: string } | null;
};

export type Assignment = {
  id: string;
  assignedAt: string;
  returnedAt: string | null;
  note: string | null;
  user: { id: string; fullName: string; email: string; department?: { name: string } };
  assignedBy: { id: string; fullName: string };
  asset?: {
    id: string;
    brand: string;
    model: string;
    serialNumber: string;
    type: AssetType;
    status: AssetStatus;
    qrCode: string;
    purchaseDate: string;
    warrantyExpiresAt: string | null;
    department: Department;
  };
};

export type AssetLog = {
  id: string;
  action: string;
  fromStatus: AssetStatus | null;
  toStatus: AssetStatus | null;
  note: string | null;
  createdAt: string;
  actor: { id: string; fullName: string };
  asset?: { id: string; brand: string; model: string; qrCode: string };
};

export type AssetDetail = AssetListItem & {
  qrDataUrl: string;
  assignments: Assignment[];
  logs: AssetLog[];
  currentHolder?: AssetListItem['currentHolder'];
};

export type DashboardStats = {
  total: number;
  faulty: number;
  inStock: number;
  assigned: number;
  retired: number;
  typeCounts: { type: AssetType; count: number }[];
  recentLogs: AssetLog[];
};
