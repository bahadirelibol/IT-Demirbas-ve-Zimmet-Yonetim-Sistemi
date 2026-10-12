import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { AssetForm, type AssetFormValues } from '../components/asset-form';
import { Badge, Button, Dialog, Field, Select, Textarea } from '../components/ui';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { actionLabels, statusLabels, statusTone, typeLabels } from '../lib/labels';
import type { AssetDetail, Department, User } from '../lib/types';
import { dateInput, formatDate, formatDateTime } from '../lib/utils';

export function AssetDetailPage() {
  const { id = '' } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [edit, setEdit] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [returnOpen, setReturnOpen] = useState(false);
  const [faultOpen, setFaultOpen] = useState(false);
  const [userId, setUserId] = useState('');
  const [note, setNote] = useState('');

  const asset = useQuery({
    queryKey: ['asset', id],
    queryFn: () => api<AssetDetail>(`/api/assets/${id}`),
  });
  const departments = useQuery({
    queryKey: ['departments'],
    queryFn: () => api<Department[]>('/api/departments'),
    enabled: user?.role === 'ADMIN',
  });
  const people = useQuery({
    queryKey: ['users-lookup'],
    queryFn: () => api<User[]>('/api/users/lookup'),
    enabled: user?.role === 'ADMIN',
  });

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: ['asset', id] });
    await queryClient.invalidateQueries({ queryKey: ['assets'] });
    await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    await queryClient.invalidateQueries({ queryKey: ['my-assets'] });
  }

  if (asset.isLoading) return <p className="text-slate-500">Yükleniyor...</p>;
  if (asset.isError || !asset.data) return <p className="text-rose-600">Cihaz bulunamadı.</p>;

  const item = asset.data;
  const openAssignment = item.assignments.find((assignment) => !assignment.returnedAt);
  const isAdmin = user?.role === 'ADMIN';
  const canFault = isAdmin || openAssignment?.user.id === user?.id;

  return (
    <div className="space-y-5">
      <Link className="text-sm text-brand" to="/assets">
        Cihazlara dön
      </Link>
      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <section className="rounded-3xl border border-slate-200 bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm text-slate-500">{typeLabels[item.type]}</p>
              <h2 className="text-2xl font-semibold text-ink">
                {item.brand} {item.model}
              </h2>
              <p className="mt-1 text-sm text-slate-500">{item.qrCode}</p>
            </div>
            <Badge tone={statusTone[item.status]}>{statusLabels[item.status]}</Badge>
          </div>
          <dl className="mt-6 grid gap-4 sm:grid-cols-2">
            <Info label="Seri no" value={item.serialNumber} />
            <Info label="Departman" value={item.department.name} />
            <Info label="Alım tarihi" value={formatDate(item.purchaseDate)} />
            <Info label="Garanti bitişi" value={formatDate(item.warrantyExpiresAt)} />
            <Info label="Zimmetli kişi" value={item.currentHolder?.fullName ?? openAssignment?.user.fullName ?? '—'} />
            <Info label="Not" value={item.notes || '—'} />
          </dl>
          <div className="mt-6 flex flex-wrap gap-2">
            {isAdmin ? (
              <Button type="button" variant="secondary" onClick={() => setEdit(true)}>
                Düzenle
              </Button>
            ) : null}
            {isAdmin && item.status !== 'ASSIGNED' && item.status !== 'RETIRED' && item.status !== 'FAULTY' ? (
              <Button type="button" onClick={() => setAssignOpen(true)}>
                Personele teslim et
              </Button>
            ) : null}
            {isAdmin && openAssignment ? (
              <Button type="button" variant="secondary" onClick={() => setReturnOpen(true)}>
                Geri kabul et
              </Button>
            ) : null}
            {canFault && item.status !== 'RETIRED' ? (
              <Button type="button" variant="danger" onClick={() => setFaultOpen(true)}>
                Arıza bildir
              </Button>
            ) : null}
            {isAdmin ? (
              <Button
                type="button"
                variant="ghost"
                onClick={async () => {
                  if (!window.confirm('Cihaz ve geçmişi silinsin mi?')) return;
                  try {
                    await api(`/api/assets/${item.id}`, { method: 'DELETE' });
                    toast.success('Cihaz silindi');
                    navigate('/assets');
                  } catch (error) {
                    toast.error(error instanceof Error ? error.message : 'Silinemedi');
                  }
                }}
              >
                Sil
              </Button>
            ) : null}
          </div>
        </section>
        <section className="rounded-3xl border border-slate-200 bg-white p-5 text-center">
          <img src={item.qrDataUrl} alt={`${item.qrCode} QR kodu`} className="mx-auto h-52 w-52" />
          <p className="mt-2 font-mono text-sm">{item.qrCode}</p>
        </section>
      </div>
      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-3xl border border-slate-200 bg-white p-5">
          <h3 className="font-semibold text-ink">Zimmet geçmişi</h3>
          <ul className="mt-3 divide-y divide-slate-100">
            {item.assignments.length === 0 ? <li className="py-3 text-sm text-slate-500">Kayıt yok</li> : null}
            {item.assignments.map((assignment) => (
              <li key={assignment.id} className="py-3 text-sm">
                <p className="font-medium">{assignment.user.fullName}</p>
                <p className="text-slate-500">
                  {formatDateTime(assignment.assignedAt)} — {assignment.returnedAt ? formatDateTime(assignment.returnedAt) : 'Açık'}
                </p>
                {assignment.note ? <p className="text-slate-600">{assignment.note}</p> : null}
              </li>
            ))}
          </ul>
        </article>
        <article className="rounded-3xl border border-slate-200 bg-white p-5">
          <h3 className="font-semibold text-ink">İşlem günlüğü</h3>
          <ul className="mt-3 divide-y divide-slate-100">
            {item.logs.map((log) => (
              <li key={log.id} className="py-3 text-sm">
                <p className="font-medium">{actionLabels[log.action]}</p>
                <p className="text-slate-500">
                  {log.actor.fullName} · {formatDateTime(log.createdAt)}
                </p>
                {log.note ? <p>{log.note}</p> : null}
              </li>
            ))}
          </ul>
        </article>
      </section>

      <Dialog open={edit} title="Cihazı güncelle" onClose={() => setEdit(false)}>
        <AssetForm
          departments={departments.data ?? []}
          showStatus
          submitLabel="Güncelle"
          initial={{
            brand: item.brand,
            model: item.model,
            serialNumber: item.serialNumber,
            type: item.type,
            purchaseDate: dateInput(item.purchaseDate),
            warrantyExpiresAt: dateInput(item.warrantyExpiresAt),
            departmentId: item.department.id,
            notes: item.notes ?? '',
            status: item.status,
          }}
          onSubmit={async (values: AssetFormValues) => {
            try {
              await api(`/api/assets/${item.id}`, {
                method: 'PATCH',
                body: JSON.stringify({
                  ...values,
                  warrantyExpiresAt: values.warrantyExpiresAt || null,
                  notes: values.notes || null,
                  status: values.status === 'ASSIGNED' ? undefined : values.status,
                }),
              });
              toast.success('Cihaz güncellendi');
              setEdit(false);
              await refresh();
            } catch (error) {
              toast.error(error instanceof Error ? error.message : 'Güncellenemedi');
            }
          }}
        />
      </Dialog>
      <Dialog open={assignOpen} title="Personele teslim et" onClose={() => setAssignOpen(false)}>
        <form
          className="space-y-4"
          onSubmit={async (event) => {
            event.preventDefault();
            try {
              await api('/api/assignments', {
                method: 'POST',
                body: JSON.stringify({ assetId: item.id, userId, note }),
              });
              toast.success('Cihaz zimmetlendi');
              setAssignOpen(false);
              setNote('');
              await refresh();
            } catch (error) {
              toast.error(error instanceof Error ? error.message : 'Zimmet başarısız');
            }
          }}
        >
          <Field label="Personel">
            <Select value={userId} onChange={(event) => setUserId(event.target.value)} required>
              <option value="">Seçin</option>
              {people.data?.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.fullName}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Not">
            <Textarea value={note} onChange={(event) => setNote(event.target.value)} />
          </Field>
          <Button type="submit">Teslim et</Button>
        </form>
      </Dialog>
      <Dialog open={returnOpen} title="Geri kabul et" onClose={() => setReturnOpen(false)}>
        <form
          className="space-y-4"
          onSubmit={async (event) => {
            event.preventDefault();
            if (!openAssignment) return;
            try {
              await api(`/api/assignments/${openAssignment.id}/return`, {
                method: 'POST',
                body: JSON.stringify({ note }),
              });
              toast.success('Cihaz geri alındı');
              setReturnOpen(false);
              setNote('');
              await refresh();
            } catch (error) {
              toast.error(error instanceof Error ? error.message : 'İade başarısız');
            }
          }}
        >
          <Field label="Not">
            <Textarea value={note} onChange={(event) => setNote(event.target.value)} />
          </Field>
          <Button type="submit">Geri kabul et</Button>
        </form>
      </Dialog>
      <Dialog open={faultOpen} title="Arıza bildir" onClose={() => setFaultOpen(false)}>
        <form
          className="space-y-4"
          onSubmit={async (event) => {
            event.preventDefault();
            try {
              await api(`/api/assets/${item.id}/fault`, {
                method: 'POST',
                body: JSON.stringify({ note }),
              });
              toast.success('Arıza kaydı oluşturuldu');
              setFaultOpen(false);
              setNote('');
              await refresh();
            } catch (error) {
              toast.error(error instanceof Error ? error.message : 'Arıza bildirilemedi');
            }
          }}
        >
          <Field label="Açıklama">
            <Textarea value={note} onChange={(event) => setNote(event.target.value)} />
          </Field>
          <Button type="submit" variant="danger">
            Bildir
          </Button>
        </form>
      </Dialog>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="mt-1 text-sm text-ink">{value}</dd>
    </div>
  );
}
