'use client'

import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { InvoiceWithItems } from '@invoice/shared'
import { toast } from '@/lib/toastStore'

interface Props {
  invoices: InvoiceWithItems[]
  page: number
  pageSize: number
  total: number
  totalPages: number
  onRefresh?: () => void
  onPageChange?: (page: number) => void
}

const STATUS_CONFIG: Record<string, { label: string; cls: string; dot: string }> = {
  borrador: {
    label: 'Borrador',
    cls: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    dot: 'bg-gray-400',
  },
  enviada: {
    label: 'Enviada',
    cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    dot: 'bg-amber-500',
  },
  pagada: {
    label: 'Pagada',
    cls: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    dot: 'bg-green-500',
  },
}

export default function InvoiceList({ invoices, page, pageSize, total, totalPages, onRefresh, onPageChange }: Props) {
  const router = useRouter()
  const [deletingId, setDeletingId] = React.useState<string | null>(null)

  const handleDelete = async (e: React.MouseEvent, id: string, number: string) => {
    e.stopPropagation()
    if (deletingId) return
    if (!confirm(`¿Eliminar factura ${number}?`)) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/invoices/${id}`, {
        method: 'DELETE',
        credentials: 'same-origin',
      })
      if (res.ok) {
        toast.success('Factura eliminada', `La factura ${number} fue eliminada.`)
        onRefresh ? onRefresh() : router.refresh()
      } else {
        toast.error('Error al eliminar', 'No se pudo eliminar la factura.')
      }
    } catch {
      toast.error('Error de conexión', 'Verifica tu conexión e intenta de nuevo.')
    } finally {
      setDeletingId(null)
    }
  }

  if (invoices.length === 0 && page === 1) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200">Sin facturas aún</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-4">Crea tu primera factura para empezar a gestionar tus cobros.</p>
        <Link
          href="/invoices/new"
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Crear primera factura
        </Link>
      </div>
    )
  }

  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-700/50 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide border-b border-gray-100 dark:border-gray-700">
              <th className="px-5 py-3 text-left">N°</th>
              <th className="px-5 py-3 text-left">Cliente</th>
              <th className="px-5 py-3 text-left">Fecha</th>
              <th className="px-5 py-3 text-left">Vencimiento</th>
              <th className="px-5 py-3 text-right">Total</th>
              <th className="px-5 py-3 text-left">Estado</th>
              <th className="px-5 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {invoices.map((inv) => {
              const status = STATUS_CONFIG[inv.status] ?? STATUS_CONFIG.borrador
              return (
                <tr
                  key={inv.id}
                  onClick={() => router.push(`/invoices/${inv.id}`)}
                  className="cursor-pointer hover:bg-blue-50/40 dark:hover:bg-gray-700/40 transition-colors"
                >
                  <td className="px-5 py-3.5 font-mono text-xs font-semibold text-gray-700 dark:text-gray-300">
                    {inv.number}
                  </td>
                  <td className="px-5 py-3.5 font-medium text-gray-800 dark:text-gray-200">
                    {inv.clientName}
                  </td>
                  <td className="px-5 py-3.5 text-gray-500 dark:text-gray-400">
                    {new Date(inv.date).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-5 py-3.5 text-gray-500 dark:text-gray-400">
                    {new Date(inv.dueDate).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-5 py-3.5 text-right font-semibold text-gray-900 dark:text-white">
                    ${inv.total.toFixed(2)}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${status.cls}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                      {status.label}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-0.5">
                      <Link
                        href={`/invoices/${inv.id}`}
                        title="Ver factura"
                        className="p-1.5 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                        </svg>
                      </Link>
                      <Link
                        href={`/invoices/${inv.id}/edit`}
                        title="Editar"
                        className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
                        </svg>
                      </Link>
                      <button
                        title="Eliminar"
                        onClick={(e) => handleDelete(e, inv.id, inv.number)}
                        disabled={deletingId === inv.id}
                        className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Mostrando {from}–{to} de {total} factura{total !== 1 ? 's' : ''}
          </p>
          <div className="flex items-center gap-1">
            {onPageChange ? (
              <>
                <button
                  onClick={() => onPageChange(page - 1)}
                  disabled={page <= 1}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                    page <= 1
                      ? 'border-gray-200 dark:border-gray-700 text-gray-300 dark:text-gray-600 cursor-not-allowed'
                      : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  ← Anterior
                </button>
                <span className="px-3 py-1.5 text-xs text-gray-500 dark:text-gray-400">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => onPageChange(page + 1)}
                  disabled={page >= totalPages}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                    page >= totalPages
                      ? 'border-gray-200 dark:border-gray-700 text-gray-300 dark:text-gray-600 cursor-not-allowed'
                      : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  Siguiente →
                </button>
              </>
            ) : (
              <>
                <Link
                  href={`/?page=${page - 1}`}
                  aria-disabled={page <= 1}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                    page <= 1
                      ? 'pointer-events-none border-gray-200 dark:border-gray-700 text-gray-300 dark:text-gray-600'
                      : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  ← Anterior
                </Link>
                <span className="px-3 py-1.5 text-xs text-gray-500 dark:text-gray-400">
                  {page} / {totalPages}
                </span>
                <Link
                  href={`/?page=${page + 1}`}
                  aria-disabled={page >= totalPages}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                    page >= totalPages
                      ? 'pointer-events-none border-gray-200 dark:border-gray-700 text-gray-300 dark:text-gray-600'
                      : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  Siguiente →
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
