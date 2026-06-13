'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { InvoiceFormValues } from '@/lib/schemas'
import { toast } from '@/lib/toastStore'

export function useInvoiceSubmit(invoiceId?: string) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const isEdit = !!invoiceId

  const submit = async (values: InvoiceFormValues) => {
    setLoading(true)
    try {
      const res = await fetch(invoiceId ? `/api/invoices/${invoiceId}` : '/api/invoices', {
        method: invoiceId ? 'PUT' : 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, notes: values.notes || undefined }),
      })

      if (res.ok) {
        const { data } = await res.json()
        toast.success(
          isEdit ? 'Factura actualizada' : 'Factura creada',
          isEdit
            ? 'Los cambios fueron guardados correctamente.'
            : `La factura ${data.number} fue creada exitosamente.`,
        )
        router.push(`/invoices/${data.id}`)
      } else {
        toast.error('Error al guardar', 'No se pudo guardar la factura. Intenta de nuevo.')
      }
    } catch {
      toast.error('Error de conexión', 'Verifica tu conexión e intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return { submit, loading }
}
