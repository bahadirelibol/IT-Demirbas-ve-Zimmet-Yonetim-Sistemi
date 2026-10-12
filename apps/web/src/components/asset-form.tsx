import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { typeLabels } from '../lib/labels';
import type { AssetStatus, AssetType, Department } from '../lib/types';
import { Button, Field, Input, Select, Textarea } from './ui';

const schema = z.object({
  brand: z.string().min(1, 'Marka gerekli'),
  model: z.string().min(1, 'Model gerekli'),
  serialNumber: z.string().min(2, 'Seri numarası en az 2 karakter olmalı'),
  type: z.enum(['COMPUTER', 'SERVER', 'MONITOR', 'OTHER']),
  purchaseDate: z.string().min(1, 'Alım tarihi gerekli'),
  warrantyExpiresAt: z.string().optional(),
  departmentId: z.string().min(1, 'Departman seçin'),
  notes: z.string().max(500).optional(),
  status: z.enum(['IN_STOCK', 'ASSIGNED', 'FAULTY', 'RETIRED']).optional(),
});

export type AssetFormValues = z.infer<typeof schema>;

export function AssetForm({
  departments,
  initial,
  showStatus,
  submitLabel,
  onSubmit,
}: {
  departments: Department[];
  initial?: Partial<AssetFormValues>;
  showStatus?: boolean;
  submitLabel: string;
  onSubmit: (values: AssetFormValues) => Promise<void>;
}) {
  const form = useForm<AssetFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      brand: initial?.brand ?? '',
      model: initial?.model ?? '',
      serialNumber: initial?.serialNumber ?? '',
      type: (initial?.type as AssetType) ?? 'COMPUTER',
      purchaseDate: initial?.purchaseDate ?? '',
      warrantyExpiresAt: initial?.warrantyExpiresAt ?? '',
      departmentId: initial?.departmentId ?? '',
      notes: initial?.notes ?? '',
      status: (initial?.status as AssetStatus) ?? 'IN_STOCK',
    },
  });

  return (
    <form
      className="grid gap-4 sm:grid-cols-2"
      onSubmit={form.handleSubmit(async (values) => {
        await onSubmit(values);
      })}
    >
      <Field label="Marka" error={form.formState.errors.brand?.message}>
        <Input {...form.register('brand')} />
      </Field>
      <Field label="Model" error={form.formState.errors.model?.message}>
        <Input {...form.register('model')} />
      </Field>
      <Field label="Seri no" error={form.formState.errors.serialNumber?.message}>
        <Input {...form.register('serialNumber')} />
      </Field>
      <Field label="Tür" error={form.formState.errors.type?.message}>
        <Select {...form.register('type')}>
          {Object.entries(typeLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Alım tarihi" error={form.formState.errors.purchaseDate?.message}>
        <Input type="date" {...form.register('purchaseDate')} />
      </Field>
      <Field label="Garanti bitişi">
        <Input type="date" {...form.register('warrantyExpiresAt')} />
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
      {showStatus ? (
        <Field label="Durum">
          <Select {...form.register('status')}>
            <option value="IN_STOCK">Depoda</option>
            <option value="FAULTY">Arızalı</option>
            <option value="RETIRED">Hurda</option>
            {initial?.status === 'ASSIGNED' ? <option value="ASSIGNED">Zimmetli</option> : null}
          </Select>
        </Field>
      ) : null}
      <div className="sm:col-span-2">
        <Field label="Not">
          <Textarea {...form.register('notes')} />
        </Field>
      </div>
      <div className="sm:col-span-2">
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
