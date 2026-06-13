import { notFound } from 'next/navigation'
import Link from 'next/link'
import { cookies } from 'next/headers'
import InvoicePreview from '@/components/InvoicePreview'
import type { InvoiceWithItems } from '@invoice/shared'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export default async function InvoicePage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value

  const res = await fetch(`${API_URL}/api/invoices/${id}`, {
    headers: token ? { Cookie: `auth_token=${token}` } : {},
    cache: 'no-store',
  })

  if (res.status === 404) notFound()
  if (!res.ok) notFound()

  const { data: invoice } = await res.json() as { data: InvoiceWithItems }

  return (
    <div className="space-y-5">
      <nav className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
        <Link href="/" className="hover:text-gray-800 dark:hover:text-gray-200 transition-colors">Facturas</Link>
        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
        </svg>
        <span className="font-mono text-gray-800 dark:text-gray-200 font-medium">{invoice.number}</span>
      </nav>
      <InvoicePreview invoice={invoice} />
    </div>
  )
}
