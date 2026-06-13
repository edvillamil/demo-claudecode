'use client'

import { useForm, useFieldArray, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { invoiceFormSchema, type InvoiceFormValues } from '@/lib/schemas'
import { useInvoiceSubmit } from '@/hooks/useInvoiceSubmit'
import InvoiceLineItem from './InvoiceLineItem'
import type { InvoiceWithItems } from '@/lib/types'

interface Props {
  invoice?: InvoiceWithItems
}

const today = () => new Date().toISOString().split('T')[0]
const in30Days = () => {
  const d = new Date()
  d.setDate(d.getDate() + 30)
  return d.toISOString().split('T')[0]
}

export default function InvoiceForm({ invoice }: Props) {
  const router = useRouter()
  const { submit, loading } = useInvoiceSubmit(invoice?.id)

  const { register, control, handleSubmit, formState: { errors } } = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: invoice
      ? {
          date: new Date(invoice.date).toISOString().split('T')[0],
          dueDate: new Date(invoice.dueDate).toISOString().split('T')[0],
          status: invoice.status as InvoiceFormValues['status'],
          issuerName: invoice.issuerName,
          issuerEmail: invoice.issuerEmail,
          issuerAddress: invoice.issuerAddress,
          clientName: invoice.clientName,
          clientEmail: invoice.clientEmail,
          clientAddress: invoice.clientAddress,
          taxRate: invoice.taxRate,
          notes: invoice.notes ?? '',
          items: invoice.items.map(({ id, description, quantity, unitPrice }) => ({
            id,
            description,
            quantity,
            unitPrice,
          })),
        }
      : {
          date: today(),
          dueDate: in30Days(),
          status: 'borrador',
          issuerName: '',
          issuerEmail: '',
          issuerAddress: '',
          clientName: '',
          clientEmail: '',
          clientAddress: '',
          taxRate: 16,
          notes: '',
          items: [{ description: '', quantity: 1, unitPrice: 0 }],
        },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'items' })

  // Totales calculados en el render — sin useEffect ni estado adicional
  const watchedItems = useWatch({ control, name: 'items' })
  const watchedTaxRate = useWatch({ control, name: 'taxRate' })
  const subtotal = watchedItems.reduce((s, i) => s + (i.quantity || 0) * (i.unitPrice || 0), 0)
  const tax = subtotal * ((watchedTaxRate || 0) / 100)
  const total = subtotal + tax

  const inputCls =
    'w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow'
  const labelCls = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'
  const errorCls = 'text-red-500 text-xs mt-1'

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-6">
      {/* Emisor / Cliente */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Emisor</h3>
          <div>
            <label className={labelCls}>Nombre / Empresa</label>
            <input {...register('issuerName')} className={inputCls} />
            {errors.issuerName && <p className={errorCls}>{errors.issuerName.message}</p>}
          </div>
          <div>
            <label className={labelCls}>Email</label>
            <input type="email" {...register('issuerEmail')} className={inputCls} />
            {errors.issuerEmail && <p className={errorCls}>{errors.issuerEmail.message}</p>}
          </div>
          <div>
            <label className={labelCls}>Dirección</label>
            <textarea rows={2} {...register('issuerAddress')} className={inputCls} />
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Cliente</h3>
          <div>
            <label className={labelCls}>Nombre / Empresa</label>
            <input {...register('clientName')} className={inputCls} />
            {errors.clientName && <p className={errorCls}>{errors.clientName.message}</p>}
          </div>
          <div>
            <label className={labelCls}>Email</label>
            <input type="email" {...register('clientEmail')} className={inputCls} />
            {errors.clientEmail && <p className={errorCls}>{errors.clientEmail.message}</p>}
          </div>
          <div>
            <label className={labelCls}>Dirección</label>
            <textarea rows={2} {...register('clientAddress')} className={inputCls} />
          </div>
        </div>
      </div>

      {/* Metadatos */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label className={labelCls}>Fecha</label>
          <input type="date" {...register('date')} className={inputCls} />
          {errors.date && <p className={errorCls}>{errors.date.message}</p>}
        </div>
        <div>
          <label className={labelCls}>Vencimiento</label>
          <input type="date" {...register('dueDate')} className={inputCls} />
          {errors.dueDate && <p className={errorCls}>{errors.dueDate.message}</p>}
        </div>
        <div>
          <label className={labelCls}>Estado</label>
          <select {...register('status')} className={inputCls}>
            <option value="borrador">Borrador</option>
            <option value="enviada">Enviada</option>
            <option value="pagada">Pagada</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>IVA (%)</label>
          <input
            type="number"
            min="0"
            max="100"
            {...register('taxRate', { valueAsNumber: true })}
            className={inputCls}
          />
        </div>
      </div>

      {/* Líneas de productos */}
      <div>
        <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">Productos / Servicios</h3>
        {errors.items?.root && <p className={errorCls}>{errors.items.root.message}</p>}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-left">
                <th className="px-2 py-2">Descripción</th>
                <th className="px-2 py-2 w-24">Cantidad</th>
                <th className="px-2 py-2 w-32">Precio unit.</th>
                <th className="px-2 py-2 w-32 text-right">Total</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {fields.map((field, index) => (
                <InvoiceLineItem
                  key={field.id}
                  index={index}
                  register={register}
                  control={control}
                  errors={errors.items?.[index]}
                  onRemove={() => remove(index)}
                  canRemove={fields.length > 1}
                />
              ))}
            </tbody>
          </table>
        </div>
        <button
          type="button"
          onClick={() => append({ description: '', quantity: 1, unitPrice: 0 })}
          className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          + Agregar línea
        </button>
      </div>

      {/* Totales — calculados en el render */}
      <div className="flex justify-end">
        <div className="w-64 space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
            <span className="dark:text-gray-200">${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">IVA ({watchedTaxRate}%)</span>
            <span className="dark:text-gray-200">${tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold text-base border-t dark:border-gray-600 pt-1">
            <span className="dark:text-white">Total</span>
            <span className="dark:text-white">${total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Notas */}
      <div>
        <label className={labelCls}>Notas (opcional)</label>
        <textarea
          rows={3}
          {...register('notes')}
          placeholder="Términos, condiciones, instrucciones de pago..."
          className={inputCls}
        />
      </div>

      {/* Botones */}
      <div className="flex gap-3 justify-end">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <svg className="w-4 h-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Guardando...
            </>
          ) : (
            invoice ? 'Actualizar factura' : 'Crear factura'
          )}
        </button>
      </div>
    </form>
  )
}
