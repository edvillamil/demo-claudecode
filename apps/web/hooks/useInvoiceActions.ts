'use client'

import { useRouter } from 'next/navigation'
import type { InvoiceWithItems } from '@invoice/shared'
import { toast } from '@/lib/toastStore'

const STATUS_LABEL: Record<string, string> = {
  borrador: 'Borrador',
  enviada: 'Enviada',
  pagada: 'Pagada',
}

export function useInvoiceActions(invoice: InvoiceWithItems) {
  const router = useRouter()

  const deleteInvoice = async () => {
    if (!confirm(`¿Eliminar factura ${invoice.number}?`)) return
    try {
      const res = await fetch(`/api/invoices/${invoice.id}`, {
        method: 'DELETE',
        credentials: 'same-origin',
      })
      if (res.ok) {
        toast.success('Factura eliminada', `La factura ${invoice.number} fue eliminada.`)
        router.push('/')
      } else {
        toast.error('Error al eliminar', 'No se pudo eliminar la factura.')
      }
    } catch {
      toast.error('Error de conexión', 'Verifica tu conexión e intenta de nuevo.')
    }
  }

  const changeStatus = async (newStatus: string) => {
    try {
      const payload: import('@/lib/types').InvoiceInput = {
        number: invoice.number,
        date: new Date(invoice.date).toISOString().split('T')[0],
        dueDate: new Date(invoice.dueDate).toISOString().split('T')[0],
        status: newStatus as import('@/lib/types').InvoiceStatus,
        clientName: invoice.clientName,
        clientEmail: invoice.clientEmail,
        clientAddress: invoice.clientAddress,
        issuerName: invoice.issuerName,
        issuerEmail: invoice.issuerEmail,
        issuerAddress: invoice.issuerAddress,
        taxRate: invoice.taxRate,
        notes: invoice.notes ?? undefined,
        items: invoice.items.map(({ id, description, quantity, unitPrice }) => ({
          id,
          description,
          quantity,
          unitPrice,
        })),
      }
      const res = await fetch(`/api/invoices/${invoice.id}`, {
        method: 'PUT',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        const label = STATUS_LABEL[newStatus] ?? newStatus
        toast.info(
          'Estado actualizado',
          `${invoice.number} ahora está marcada como "${label}".`,
        )
        router.refresh()
      } else {
        toast.error('Error al actualizar', 'No se pudo cambiar el estado.')
      }
    } catch {
      toast.error('Error de conexión', 'Verifica tu conexión e intenta de nuevo.')
    }
  }

  return { deleteInvoice, changeStatus }
}
