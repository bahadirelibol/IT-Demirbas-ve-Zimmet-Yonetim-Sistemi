import { Laptop, LayoutDashboard, LogOut, Menu, Package, Users, X } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { NavLink, Navigate, Outlet } from 'react-router-dom';
import { roleLabels } from '../lib/labels';
import { useAuth } from '../lib/auth';
import { cn } from '../lib/utils';

const links = [
  { to: '/', label: 'Gösterge Paneli', icon: LayoutDashboard, end: true },
  { to: '/assets', label: 'Cihazlar', icon: Laptop, end: false },
  { to: '/my-assets', label: 'Zimmetlerim', icon: Package, end: false },
];

export function ProtectedLayout() {
  const { user, ready, logout } = useAuth();
  const [open, setOpen] = useState(false);

  if (!ready) {
    return <div className="grid min-h-screen place-items-center text-slate-500">Yükleniyor...</div>;
  }
  if (!user) return <Navigate to="/login" replace />;

  const items = user.role === 'ADMIN' ? [...links, { to: '/users', label: 'Kullanıcılar', icon: Users, end: false }] : links;

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
      <aside className={cn('fixed inset-y-0 left-0 z-40 w-72 bg-ink text-white lg:sticky lg:top-0 lg:block lg:h-screen lg:w-auto', open ? 'block' : 'hidden')}>
        <div className="flex h-full flex-col p-5">
          <div className="mb-8 flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-teal-200/80">Kurum içi</p>
              <h1 className="mt-1 text-xl font-semibold">Demirbaş</h1>
              <p className="text-sm text-slate-300">Zimmet Yönetimi</p>
            </div>
            <button type="button" aria-label="Menüyü kapat" className="rounded-lg p-2 lg:hidden" onClick={() => setOpen(false)}>
              <X size={18} />
            </button>
          </div>
          <nav className="space-y-1">
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm text-slate-200 hover:bg-white/10',
                    isActive && 'bg-white/15 font-semibold text-white',
                  )
                }
              >
                <item.icon size={18} />
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="mt-auto rounded-2xl bg-white/10 p-3">
            <p className="font-medium">{user.fullName}</p>
            <p className="text-xs text-slate-300">{roleLabels[user.role]}</p>
            <button
              type="button"
              className="mt-3 flex items-center gap-2 text-sm text-teal-100"
              onClick={() => void logout()}
            >
              <LogOut size={16} />
              Çıkış yap
            </button>
          </div>
        </div>
      </aside>
      {open ? <button type="button" className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setOpen(false)} /> : null}
      <div className="min-w-0">
        <header className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
          <button type="button" aria-label="Menüyü aç" className="rounded-xl border border-slate-200 p-2" onClick={() => setOpen(true)}>
            <Menu size={18} />
          </button>
          <span className="font-semibold text-ink">Demirbaş</span>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export function AdminOnly({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth();
  if (!ready) return null;
  if (user?.role !== 'ADMIN') return <Navigate to="/" replace />;
  return children;
}
