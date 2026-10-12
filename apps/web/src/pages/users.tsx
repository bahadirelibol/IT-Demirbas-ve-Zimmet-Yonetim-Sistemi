import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Badge, Button, Dialog, Field, Input, Pager, Select } from '../components/ui';
import { api, qs } from '../lib/api';
import { roleLabels } from '../lib/labels';
import type { Department, PageMeta, Role, User } from '../lib/types';

const userSchema = z.object({
  fullName: z.string().min(2, 'Ad soyad en az 2 karakter olmalı'),
  email: z.string().email('Geçerli bir e-posta girin'),
  password: z.string().optional(),
  role: z.enum(['ADMIN', 'PERSONEL']),
  departmentId: z.string().min(1, 'Departman seçin'),
  isActive: z.boolean(),
});

type UserFormValues = z.infer<typeof userSchema>;

export function UsersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<User | null>(null);
  const [creating, setCreating] = useState(false);
  const [passwordUser, setPasswordUser] = useState<User | null>(null);
  const [password, setPassword] = useState('');
  const [departmentName, setDepartmentName] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const users = useQuery({
    queryKey: ['users', debounced, page],
    queryFn: () => api<{ data: User[]; meta: PageMeta }>(`/api/users${qs({ search: debounced, page, limit: 8 })}`),
  });
  const departments = useQuery({
    queryKey: ['departments'],
    queryFn: () => api<Department[]>('/api/departments'),
  });

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: ['users'] });
    await queryClient.invalidateQueries({ queryKey: ['users-lookup'] });
    await queryClient.invalidateQueries({ queryKey: ['departments'] });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-ink">Kullanıcılar</h2>
          <p className="text-sm text-slate-500">Hesap, rol ve departman yönetimi</p>
        </div>
        <Button type="button" onClick={() => setCreating(true)}>
          Yeni kullanıcı
        </Button>
      </div>
      <Input placeholder="Ad veya e-posta ara" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} />
      <div className="overflow-x-auto rounded-3xl border border-slate-200/80 bg-white shadow-sm shadow-slate-200/70">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Ad</th>
              <th className="px-4 py-3 font-medium">E-posta</th>
              <th className="px-4 py-3 font-medium">Rol</th>
              <th className="px-4 py-3 font-medium">Departman</th>
              <th className="px-4 py-3 font-medium">Durum</th>
              <th className="px-4 py-3 font-medium">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {users.data?.data.map((person) => (
              <tr key={person.id} className="border-t border-slate-100 transition hover:bg-slate-50/80">
                <td className="px-4 py-3 font-medium">{person.fullName}</td>
                <td className="px-4 py-3">{person.email}</td>
                <td className="px-4 py-3">{roleLabels[person.role]}</td>
                <td className="px-4 py-3">{person.department?.name}</td>
                <td className="px-4 py-3">
                  <Badge tone={person.isActive ? 'bg-teal-100 text-teal-800' : 'bg-slate-200 text-slate-600'}>
                    {person.isActive ? 'Aktif' : 'Pasif'}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="secondary" onClick={() => setEditing(person)}>
                      Düzenle
                    </Button>
                    <Button type="button" variant="secondary" onClick={() => setPasswordUser(person)}>
                      Şifre
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={async () => {
                        if (!window.confirm(`${person.fullName} silinsin mi?`)) return;
                        try {
                          await api(`/api/users/${person.id}`, { method: 'DELETE' });
                          toast.success('Kullanıcı silindi');
                          await refresh();
                        } catch (error) {
                          toast.error(error instanceof Error ? error.message : 'Silinemedi');
                        }
                      }}
                    >
                      Sil
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {users.data ? (
        <Pager page={users.data.meta.page} pageCount={users.data.meta.pageCount} total={users.data.meta.total} onPage={setPage} />
      ) : null}

      <section className="rounded-3xl border border-slate-200/80 bg-white shadow-sm shadow-slate-200/70 p-5">
        <h3 className="font-semibold text-ink">Departmanlar</h3>
        <form
          className="mt-3 flex flex-col gap-2 sm:flex-row"
          onSubmit={async (event) => {
            event.preventDefault();
            try {
              await api('/api/departments', { method: 'POST', body: JSON.stringify({ name: departmentName }) });
              setDepartmentName('');
              toast.success('Departman eklendi');
              await refresh();
            } catch (error) {
              toast.error(error instanceof Error ? error.message : 'Eklenemedi');
            }
          }}
        >
          <Input value={departmentName} onChange={(event) => setDepartmentName(event.target.value)} placeholder="Yeni departman" />
          <Button type="submit">Ekle</Button>
        </form>
        <ul className="mt-4 divide-y divide-slate-100">
          {departments.data?.map((department) => (
            <DepartmentRow key={department.id} department={department} onChanged={refresh} />
          ))}
        </ul>
      </section>

      <UserDialog
        open={creating || !!editing}
        title={editing ? 'Kullanıcıyı güncelle' : 'Yeni kullanıcı'}
        user={editing}
        departments={departments.data ?? []}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
        onSaved={async () => {
          setCreating(false);
          setEditing(null);
          await refresh();
        }}
      />
      <Dialog open={!!passwordUser} title="Şifre sıfırla" onClose={() => setPasswordUser(null)}>
        <form
          className="space-y-4"
          onSubmit={async (event) => {
            event.preventDefault();
            if (!passwordUser) return;
            try {
              await api(`/api/users/${passwordUser.id}/password`, {
                method: 'PATCH',
                body: JSON.stringify({ password }),
              });
              toast.success('Şifre güncellendi');
              setPassword('');
              setPasswordUser(null);
            } catch (error) {
              toast.error(error instanceof Error ? error.message : 'Şifre güncellenemedi');
            }
          }}
        >
          <Field label="Yeni şifre">
            <Input type="password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} required />
          </Field>
          <Button type="submit">Kaydet</Button>
        </form>
      </Dialog>
    </div>
  );
}

function DepartmentRow({ department, onChanged }: { department: Department; onChanged: () => Promise<void> }) {
  const [name, setName] = useState(department.name);
  return (
    <li className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center">
      <Input value={name} onChange={(event) => setName(event.target.value)} />
      <div className="flex gap-2">
        <Button
          type="button"
          variant="secondary"
          onClick={async () => {
            try {
              await api(`/api/departments/${department.id}`, { method: 'PATCH', body: JSON.stringify({ name }) });
              toast.success('Departman güncellendi');
              await onChanged();
            } catch (error) {
              toast.error(error instanceof Error ? error.message : 'Güncellenemedi');
            }
          }}
        >
          Güncelle
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={async () => {
            try {
              await api(`/api/departments/${department.id}`, { method: 'DELETE' });
              toast.success('Departman silindi');
              await onChanged();
            } catch (error) {
              toast.error(error instanceof Error ? error.message : 'Silinemedi');
            }
          }}
        >
          Sil
        </Button>
      </div>
    </li>
  );
}

function UserDialog({
  open,
  title,
  user,
  departments,
  onClose,
  onSaved,
}: {
  open: boolean;
  title: string;
  user: User | null;
  departments: Department[];
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    values: {
      fullName: user?.fullName ?? '',
      email: user?.email ?? '',
      password: '',
      role: (user?.role as Role) ?? 'PERSONEL',
      departmentId: user?.departmentId ?? '',
      isActive: user?.isActive ?? true,
    },
  });

  return (
    <Dialog open={open} title={title} onClose={onClose}>
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit(async (values) => {
          try {
            if (user) {
              await api(`/api/users/${user.id}`, {
                method: 'PATCH',
                body: JSON.stringify({
                  fullName: values.fullName,
                  email: values.email,
                  role: values.role,
                  departmentId: values.departmentId,
                  isActive: values.isActive,
                }),
              });
              toast.success('Kullanıcı güncellendi');
            } else {
              if (!values.password || values.password.length < 8) {
                toast.error('Şifre en az 8 karakter olmalı');
                return;
              }
              await api('/api/users', {
                method: 'POST',
                body: JSON.stringify({
                  fullName: values.fullName,
                  email: values.email,
                  password: values.password,
                  role: values.role,
                  departmentId: values.departmentId,
                }),
              });
              toast.success('Kullanıcı eklendi');
            }
            await onSaved();
          } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Kayıt başarısız');
          }
        })}
      >
        <Field label="Ad soyad" error={form.formState.errors.fullName?.message}>
          <Input {...form.register('fullName')} />
        </Field>
        <Field label="E-posta" error={form.formState.errors.email?.message}>
          <Input type="email" {...form.register('email')} />
        </Field>
        {user ? null : (
          <Field label="Şifre">
            <Input type="password" {...form.register('password')} />
          </Field>
        )}
        <Field label="Rol">
          <Select {...form.register('role')}>
            <option value="PERSONEL">Personel</option>
            <option value="ADMIN">Yönetici</option>
          </Select>
        </Field>
        <Field label="Departman" error={form.formState.errors.departmentId?.message}>
          <Select {...form.register('departmentId')}>
            <option value="">Seçin</option>
            {departments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </Select>
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" {...form.register('isActive')} />
          Aktif hesap
        </label>
        <Button type="submit">Kaydet</Button>
      </form>
    </Dialog>
  );
}
