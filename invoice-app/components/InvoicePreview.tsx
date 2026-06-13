'use client'

import Link from 'next/link'
import { useInvoiceActions } from '@/hooks/useInvoiceActions'
import type { InvoiceWithItems } from '@/lib/types'

interface Props {
  invoice: InvoiceWithItems
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

export default function InvoicePreview({ invoice }: Props) {
  const { deleteInvoice, changeStatus } = useInvoiceActions(invoice)
  const status = STATUS_CONFIG[invoice.status] ?? STATUS_CONFIG.borrador

  return (
    <div>
      {/* Actions bar */}
      <div className="flex flex-wrap items-center gap-2 mb-5 print:hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 shadow-sm">
        <Link
          href={`/invoices/${invoice.id}/edit`}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
          </svg>
          Editar
        </Link>

        <select
          value={invoice.status}
          onChange={(e) => changeStatus(e.target.value)}
          className="px-3 py-1.5 text-sm font-medium border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
        >
          <option value="borrador">Borrador</option>
          <option value="enviada">Enviada</option>
          <option value="pagada">Pagada</option>
        </select>

        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5Zm-3 0h.008v.008H15V10.5Z" />
          </svg>
          Imprimir / PDF
        </button>

        <button
          onClick={deleteInvoice}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors ml-auto"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
          </svg>
          Eliminar
        </button>
      </div>

      {/* Invoice document */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-8 shadow-sm max-w-3xl mx-auto print:shadow-none print:border-none print:rounded-none">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">FACTURA</h1>
            <p className="text-gray-400 dark:text-gray-500 mt-1 font-mono text-sm">{invoice.number}</p>
          </div>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${status.cls}`}>
            <span className={`w-2 h-2 rounded-full ${status.dot}`} />
            {status.label}
          </span>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-6 mb-8 text-sm">
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
            <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">Fecha de emisión</p>
            <p className="font-semibold text-gray-800 dark:text-gray-200">
              {new Date(invoice.date).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
            <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">Fecha de vencimiento</p>
            <p className="font-semibold text-gray-800 dark:text-gray-200">
              {new Date(invoice.dueDate).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Parties */}
        <div className="grid grid-cols-2 gap-8 mb-8 text-sm">
          <div>
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">De</p>
            <p className="font-semibold text-gray-900 dark:text-white">{invoice.issuerName}</p>
            <p className="text-gray-500 dark:text-gray-400 mt-0.5">{invoice.issuerEmail}</p>
            <p className="text-gray-500 dark:text-gray-400 whitespace-pre-line mt-0.5">{invoice.issuerAddress}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Para</p>
            <p className="font-semibold text-gray-900 dark:text-white">{invoice.clientName}</p>
            <p className="text-gray-500 dark:text-gray-400 mt-0.5">{invoice.clientEmail}</p>
            <p className="text-gray-500 dark:text-gray-400 whitespace-pre-line mt-0.5">{invoice.clientAddress}</p>
          </div>
        </div>

        {/* Items */}
        <table className="w-full text-sm mb-6">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-700/50 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              <th className="text-left px-3 py-2.5 rounded-l-lg">Descripción</th>
              <th className="text-right px-3 py-2.5 w-20">Cant.</th>
              <th className="text-right px-3 py-2.5 w-28">Precio unit.</th>
              <th className="text-right px-3 py-2.5 w-28 rounded-r-lg">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {invoice.items.map((item) => (
              <tr key={item.id}>
                <td className="px-3 py-3 text-gray-800 dark:text-gray-200">{item.description}</td>
                <td className="px-3 py-3 text-right text-gray-600 dark:text-gray-400">{item.quantity}</td>
                <td className="px-3 py-3 text-right text-gray-600 dark:text-gray-400">${item.unitPrice.toFixed(2)}</td>
                <td className="px-3 py-3 text-right font-medium text-gray-900 dark:text-white">${item.total.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-60 space-y-2 text-sm">
            <div className="flex justify-between text-gray-500 dark:text-gray-400">
              <span>Subtotal</span>
              <span>${invoice.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-500 dark:text-gray-400">
              <span>IVA ({invoice.taxRate}%)</span>
              <span>${invoice.tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-base text-gray-900 dark:text-white border-t dark:border-gray-600 pt-2.5 mt-1">
              <span>Total</span>
              <span>${invoice.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div className="mt-8 pt-6 border-t dark:border-gray-700 text-sm">
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">Notas</p>
            <p className="text-gray-600 dark:text-gray-400 whitespace-pre-line">{invoice.notes}</p>
          </div>
        )}
      </div>
    </div>
  )
}
