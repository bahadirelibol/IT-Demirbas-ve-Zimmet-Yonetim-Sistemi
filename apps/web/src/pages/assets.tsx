import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { AssetForm, type AssetFormValues } from '../components/asset-form';
import { Badge, Button, Dialog, Input, Pager, Select } from '../components/ui';
import { api, qs } from '../lib/api';
import { useAuth } from '../lib/auth';
import { statusLabels, statusTone, typeLabels } from '../lib/labels';
import type { AssetListItem, Department, PageMeta, User } from '../lib/types';

function payload(values: AssetFormValues, withStatus: boolean) {
  return {
    brand: values.brand,
    model: values.model,
    serialNumber: values.serialNumber,
    type: values.type,
    purchaseDate: values.purchaseDate,
    warrantyExpiresAt: values.warrantyExpiresAt || null,
    departmentId: values.departmentId,
    notes: values.notes || null,
    ...(withStatus && values.status ? { status: values.status } : {}),
  };
}

export function AssetsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [status, setStatus] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [userId, setUserId] = useState('');
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debounced, status, departmentId, userId]);

  const departments = useQuery({
    queryKey: ['departments'],
    queryFn: () => api<Department[]>('/api/departments'),
  });
  const people = useQuery({
    queryKey: ['users-lookup'],
    queryFn: () => api<User[]>('/api/users/lookup'),
    enabled: user?.role === 'ADMIN',
  });
  const assets = useQuery({
    queryKey: ['assets', { debounced, status, departmentId, userId, page }],
    queryFn: () =>
      api<{ data: AssetListItem[]; meta: PageMeta }>(
        `/api/assets${qs({ search: debounced, status, departmentId, userId, page, limit: 8 })}`,
      ),
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-ink">Cihazlar</h2>
          <p className="text-sm text-slate-500">Arama, durum ve departman filtresi</p>
        </div>
        {user?.role === 'ADMIN' ? (
          <Button type="button" onClick={() => setOpen(true)}>
            <Plus size={16} />
            Yeni cihaz
          </Button>
        ) : null}
      </div>
      <div className="grid gap-3 rounded-3xl border border-slate-200 bg-white p-4 md:grid-cols-4">
        <div className="relative md:col-span-1">
          <Search className="pointer-events-none absolute left-3 top-3 text-slate-400" size={16} />
          <Input className="pl-9" placeholder="Marka, model, seri no, QR" value={search} onChange={(event) => setSearch(event.target.value)} />
        </div>
        <Select value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">Tüm durumlar</option>
          {Object.entries(statusLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
        <Select value={departmentId} onChange={(event) => setDepartmentId(event.target.value)}>
          <option value="">Tüm departmanlar</option>
          {departments.data?.map((department) => (
            <option key={department.id} value={department.id}>
              {department.name}
            </option>
          ))}
        </Select>
        {user?.role === 'ADMIN' ? (
          <Select value={userId} onChange={(event) => setUserId(event.target.value)}>
            <option value="">Tüm kullanıcılar</option>
            {people.data?.map((person) => (
              <option key={person.id} value={person.id}>
                {person.fullName}
              </option>
            ))}
          </Select>
        ) : null}
      </div>
      {assets.isLoading ? <p className="text-slate-500">Yükleniyor...</p> : null}
      {assets.isError ? <p className="text-rose-600">Cihaz listesi alınamadı.</p> : null}
      <div className="hidden overflow-hidden rounded-3xl border border-slate-200 bg-white md:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Cihaz</th>
              <th className="px-4 py-3 font-medium">Seri / QR</th>
              <th className="px-4 py-3 font-medium">Departman</th>
              <th className="px-4 py-3 font-medium">Zimmet</th>
              <th className="px-4 py-3 font-medium">Durum</th>
            </tr>
          </thead>
          <tbody>
            {assets.data?.data.map((asset) => (
              <tr key={asset.id} className="border-t border-slate-100">
                <td className="px-4 py-3">
                  <Link className="font-medium text-ink hover:underline" to={`/assets/${asset.id}`}>
                    {asset.brand} {asset.model}
                  </Link>
                  <p className="text-xs text-slate-500">{typeLabels[asset.type]}</p>
                </td>
                <td className="px-4 py-3">
                  <p>{asset.serialNumber}</p>
                  <p className="text-xs text-slate-500">{asset.qrCode}</p>
                </td>
                <td className="px-4 py-3">{asset.department.name}</td>
                <td className="px-4 py-3">{asset.currentHolder?.fullName ?? '—'}</td>
                <td className="px-4 py-3">
                  <Badge tone={statusTone[asset.status]}>{statusLabels[asset.status]}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="space-y-3 md:hidden">
        {assets.data?.data.map((asset) => (
          <Link key={asset.id} to={`/assets/${asset.id}`} className="block rounded-3xl border border-slate-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-ink">
                  {asset.brand} {asset.model}
                </p>
                <p className="text-sm text-slate-500">{asset.serialNumber}</p>
                <p className="mt-2 text-sm">{asset.currentHolder?.fullName ?? asset.department.name}</p>
              </div>
              <Badge tone={statusTone[asset.status]}>{statusLabels[asset.status]}</Badge>
            </div>
          </Link>
        ))}
      </div>
      {assets.data ? (
        <Pager
          page={assets.data.meta.page}
          pageCount={assets.data.meta.pageCount}
          total={assets.data.meta.total}
          onPage={setPage}
        />
      ) : null}
      <Dialog open={open} title="Yeni cihaz" onClose={() => setOpen(false)}>
        <AssetForm
          departments={departments.data ?? []}
          submitLabel="Kaydet"
          onSubmit={async (values) => {
            try {
              await api('/api/assets', { method: 'POST', body: JSON.stringify(payload(values, false)) });
              toast.success('Cihaz eklendi');
              setOpen(false);
              await queryClient.invalidateQueries({ queryKey: ['assets'] });
              await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
            } catch (error) {
              toast.error(error instanceof Error ? error.message : 'Kayıt başarısız');
            }
          }}
        />
      </Dialog>
    </div>
  );
}
