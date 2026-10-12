import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Navigate, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button, Field, Input } from '../components/ui';
import { useAuth } from '../lib/auth';

const schema = z.object({
  email: z.string().email('Geçerli bir e-posta girin'),
  password: z.string().min(8, 'Şifre en az 8 karakter olmalı'),
});

type FormValues = z.infer<typeof schema>;

export function LoginPage() {
  const { user, ready, login } = useAuth();
  const navigate = useNavigate();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  if (!ready) return null;
  if (user) return <Navigate to="/" replace />;

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <section className="hidden flex-col justify-between bg-ink p-10 text-white lg:flex">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-teal-200">Yapay Zeka ve Dijital Dönüşüm</p>
          <h1 className="mt-6 max-w-md text-4xl font-semibold leading-tight">
            IT Demirbaş ve Zimmet Yönetim Sistemi
          </h1>
          <p className="mt-4 max-w-md text-slate-300">
            Bilgisayar, sunucu ve monitörlerin kaydı, durum takibi ve personele zimmeti tek panelde.
          </p>
        </div>
        <p className="text-sm text-slate-400">Kurum içi envanter</p>
      </section>
      <section className="flex items-center justify-center px-4 py-10">
        <form
          className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
          onSubmit={form.handleSubmit(async (values) => {
            try {
              await login(values.email, values.password);
              toast.success('Giriş başarılı');
              navigate('/');
            } catch (error) {
              toast.error(error instanceof Error ? error.message : 'Giriş başarısız');
            }
          })}
        >
          <h2 className="text-2xl font-semibold text-ink">Giriş yap</h2>
          <p className="mt-1 text-sm text-slate-500">Kurum hesabınızla devam edin.</p>
          <div className="mt-6 space-y-4">
            <Field label="E-posta" error={form.formState.errors.email?.message}>
              <Input type="email" autoComplete="username" {...form.register('email')} />
            </Field>
            <Field label="Şifre" error={form.formState.errors.password?.message}>
              <Input type="password" autoComplete="current-password" {...form.register('password')} />
            </Field>
          </div>
          <Button className="mt-6 w-full" type="submit" disabled={form.formState.isSubmitting}>
            Giriş yap
          </Button>
          <div className="mt-5 rounded-2xl bg-canvas px-4 py-3 text-xs leading-5 text-slate-600">
            <p>Yönetici: admin@kurum.local / Admin123!</p>
            <p>Personel: ayse.yilmaz@kurum.local / Personel123!</p>
          </div>
        </form>
      </section>
    </div>
  );
}
