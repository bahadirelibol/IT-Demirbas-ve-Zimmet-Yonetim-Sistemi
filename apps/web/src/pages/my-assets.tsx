import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { statusLabels, statusTone, typeLabels } from '../lib/labels';
import type { Assignment } from '../lib/types';
import { Badge } from '../components/ui';
import { formatDate } from '../lib/utils';

export function MyAssetsPage() {
  const query = useQuery({
    queryKey: ['my-assets'],
    queryFn: () => api<{ data: Assignment[] }>('/api/me/assets'),
  });

  if (query.isLoading) return <p className="text-slate-500">Yükleniyor...</p>;
  if (query.isError) return <p className="text-rose-600">Zimmetler alınamadı.</p>;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold text-ink">Zimmetlerim</h2>
        <p className="text-sm text-slate-500">Üzerinize açık olan cihazlar</p>
      </div>
      {query.data?.data.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
          Açık zimmetiniz yok.
        </p>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        {query.data?.data.map((assignment) => (
          <Link
            key={assignment.id}
            to={`/assets/${assignment.asset?.id}`}
            className="rounded-3xl border border-slate-200 bg-white p-5 hover:border-brand"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-slate-500">{assignment.asset ? typeLabels[assignment.asset.type] : ''}</p>
                <h3 className="text-lg font-semibold text-ink">
                  {assignment.asset?.brand} {assignment.asset?.model}
                </h3>
              </div>
              {assignment.asset ? <Badge tone={statusTone[assignment.asset.status]}>{statusLabels[assignment.asset.status]}</Badge> : null}
            </div>
            <dl className="mt-4 space-y-1 text-sm text-slate-600">
              <div>Seri no: {assignment.asset?.serialNumber}</div>
              <div>QR: {assignment.asset?.qrCode}</div>
              <div>Alım: {formatDate(assignment.asset?.purchaseDate)}</div>
              <div>Garanti: {formatDate(assignment.asset?.warrantyExpiresAt)}</div>
              <div>Departman: {assignment.asset?.department.name}</div>
            </dl>
          </Link>
        ))}
      </div>
    </div>
  );
}
