import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import InvoiceForm from '@/components/InvoiceForm'
import type { InvoiceWithItems } from '@/lib/types'

export default async function EditInvoicePage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { items: true },
  })

  if (!invoice) notFound()

  return (
    <div className="space-y-6">
      <div>
        <nav className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 mb-3">
          <Link href="/" className="hover:text-gray-800 dark:hover:text-gray-200 transition-colors">Facturas</Link>
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
          <Link href={`/invoices/${id}`} className="font-mono hover:text-gray-800 dark:hover:text-gray-200 transition-colors">
            {invoice.number}
          </Link>
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
          <span className="text-gray-800 dark:text-gray-200 font-medium">Editar</span>
        </nav>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Editar {invoice.number}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Modifica los datos de la factura.</p>
      </div>
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
        <InvoiceForm invoice={invoice as InvoiceWithItems} />
      </div>
    </div>
  )
}
