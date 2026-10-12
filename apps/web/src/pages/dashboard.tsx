import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Boxes, Laptop, Warehouse } from 'lucide-react';
import { Link } from 'react-router-dom';
import { actionLabels, statusLabels, typeLabels } from '../lib/labels';
import { api } from '../lib/api';
import type { DashboardStats } from '../lib/types';
import { formatDateTime } from '../lib/utils';

const cards = [
  { key: 'total', label: 'Toplam cihaz', icon: Boxes, tone: 'bg-ink text-white' },
  { key: 'faulty', label: 'Arızalı', icon: AlertTriangle, tone: 'bg-rose-50 text-rose-700' },
  { key: 'inStock', label: 'Depoda', icon: Warehouse, tone: 'bg-sky-50 text-sky-700' },
  { key: 'assigned', label: 'Zimmetli', icon: Laptop, tone: 'bg-teal-50 text-teal-800' },
] as const;

export function DashboardPage() {
  const query = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api<DashboardStats>('/api/dashboard/stats'),
  });

  if (query.isLoading) return <p className="text-slate-500">Yükleniyor...</p>;
  if (query.isError || !query.data) return <p className="text-rose-600">Panel verisi alınamadı.</p>;

  const stats = query.data;
  const maxType = Math.max(...stats.typeCounts.map((item) => item.count), 1);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-ink">Gösterge paneli</h2>
        <p className="text-sm text-slate-500">Envanterin güncel dağılımı</p>
      </div>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <article key={card.key} className={`rounded-3xl p-5 ${card.tone}`}>
            <card.icon size={20} />
            <p className="mt-4 text-3xl font-semibold">{stats[card.key]}</p>
            <p className="text-sm opacity-80">{card.label}</p>
          </article>
        ))}
      </section>
      <section className="grid gap-4 lg:grid-cols-[1fr_1.3fr]">
        <article className="rounded-3xl border border-slate-200 bg-white p-5">
          <h3 className="font-semibold text-ink">Türe göre</h3>
          <div className="mt-4 space-y-3">
            {stats.typeCounts.map((item) => (
              <div key={item.type}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{typeLabels[item.type]}</span>
                  <span className="text-slate-500">{item.count}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full bg-brand"
                    style={{ width: `${(item.count / maxType) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-slate-500">Hurda: {stats.retired}</p>
        </article>
        <article className="rounded-3xl border border-slate-200 bg-white p-5">
          <h3 className="font-semibold text-ink">Son işlemler</h3>
          <ul className="mt-4 divide-y divide-slate-100">
            {stats.recentLogs.map((log) => (
              <li key={log.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                <div>
                  <Link className="font-medium text-ink hover:underline" to={`/assets/${log.asset?.id}`}>
                    {log.asset?.brand} {log.asset?.model}
                  </Link>
                  <p className="text-slate-500">
                    {actionLabels[log.action]} · {log.actor.fullName}
                    {log.toStatus ? ` · ${statusLabels[log.toStatus]}` : ''}
                  </p>
                </div>
                <span className="text-xs text-slate-400">{formatDateTime(log.createdAt)}</span>
              </li>
            ))}
          </ul>
        </article>
      </section>
    </div>
  );
}
