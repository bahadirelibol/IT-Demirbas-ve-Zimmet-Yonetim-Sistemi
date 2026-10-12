import { cva, type VariantProps } from 'class-variance-authority';
import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';
import { cn } from '../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition duration-150 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100',
  {
    variants: {
      variant: {
        primary: 'bg-brand text-white shadow-sm shadow-teal-900/15 hover:bg-teal-800',
        secondary: 'border border-slate-200 bg-white text-ink shadow-sm shadow-slate-200/60 hover:bg-slate-50',
        danger: 'bg-rose-600 text-white shadow-sm shadow-rose-900/15 hover:bg-rose-700',
        ghost: 'text-slate-600 hover:bg-slate-100',
      },
    },
    defaultVariants: { variant: 'primary' },
  },
);

export function Button({
  className,
  variant,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>) {
  return <button className={cn(buttonVariants({ variant }), className)} {...props} />;
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm shadow-slate-200/50 outline-none ring-brand/20 transition placeholder:text-slate-400 focus:border-brand focus:ring-4',
        props.className,
      )}
    />
  );
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm shadow-slate-200/50 outline-none ring-brand/20 transition focus:border-brand focus:ring-4',
        props.className,
      )}
    />
  );
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        'min-h-24 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm shadow-slate-200/50 outline-none ring-brand/20 transition focus:border-brand focus:ring-4',
        props.className,
      )}
    />
  );
}

export function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      {children}
      {error ? <span className="block text-xs text-rose-600">{error}</span> : null}
    </label>
  );
}

export function Badge({ tone, children }: { tone: string; children: ReactNode }) {
  return (
    <span className={cn('inline-flex rounded-full px-2.5 py-1 text-xs font-semibold', tone)}>
      {children}
    </span>
  );
}

export function Dialog({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 backdrop-blur-sm sm:items-center">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-slate-200/80 bg-white p-5 shadow-2xl shadow-slate-900/10">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-ink">{title}</h2>
          <button type="button" className="rounded-lg px-2 py-1 text-slate-500 hover:bg-slate-100" onClick={onClose}>
            Kapat
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Pager({
  page,
  pageCount,
  total,
  onPage,
}: {
  page: number;
  pageCount: number;
  total: number;
  onPage: (page: number) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-4">
      <p className="text-sm text-slate-500">{total} kayıt</p>
      <div className="flex items-center gap-2">
        <Button type="button" variant="secondary" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          Önceki
        </Button>
        <span className="min-w-16 text-center text-sm text-slate-600">
          {page} / {pageCount}
        </span>
        <Button
          type="button"
          variant="secondary"
          disabled={page >= pageCount}
          onClick={() => onPage(page + 1)}
        >
          Sonraki
        </Button>
      </div>
    </div>
  );
}
