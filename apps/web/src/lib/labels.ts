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

export const roleLabels: Record<string, string> = {
  ADMIN: 'Yönetici',
  PERSONEL: 'Personel',
};

export const actionLabels: Record<string, string> = {
  CREATED: 'Kayıt oluşturuldu',
  UPDATED: 'Güncellendi',
  ASSIGNED: 'Zimmetlendi',
  RETURNED: 'İade alındı',
  FAULT_REPORTED: 'Arıza bildirildi',
};

export const statusTone: Record<string, string> = {
  IN_STOCK: 'bg-sky-100 text-sky-800',
  ASSIGNED: 'bg-teal-100 text-teal-800',
  FAULTY: 'bg-rose-100 text-rose-800',
  RETIRED: 'bg-slate-200 text-slate-700',
};
