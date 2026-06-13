'use client'

import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import InvoiceList from '@/components/InvoiceList'
import FilterSidebar from '@/components/FilterSidebar'
import { apiFetch, ApiError } from '@/hooks/useInvoiceFetch'
import { useFilterStore } from '@/lib/filterStore'
import type { InvoiceWithItems } from '@invoice/shared'

const PAGE_SIZE = 15

interface Stats {
  total: number
  pagadas: number
  totalFacturado: number
}

function HomeContent() {
  const [allInvoices, setAllInvoices] = useState<InvoiceWithItems[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, pagadas: 0, totalFacturado: 0 })
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [tick, setTick] = useState(0)

  const { search, statuses, dateFrom, dateTo, amountMin, amountMax } = useFilterStore()

  // Fetch all invoices + stats once (and on refresh)
  useEffect(() => {
    let cancelled = false
    const fetchData = async () => {
      setLoading(true)
      try {
        const [invoices, statsData] = await Promise.all([
          apiFetch<InvoiceWithItems[]>('/api/invoices'),
          apiFetch<Stats>('/api/invoices/stats'),
        ])
        if (!cancelled) {
          setAllInvoices(invoices)
          setStats(statsData)
        }
      } catch (err) {
        if (!cancelled && err instanceof ApiError && err.status === 401) {
          window.location.href = '/login'
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchData()
    return () => { cancelled = true }
  }, [tick])

  // Reset page to 1 when any filter changes
  const filterKey = [search, ...statuses.sort(), dateFrom, dateTo, amountMin, amountMax].join('|')
  const prevFilterKey = useRef(filterKey)
  useEffect(() => {
    if (prevFilterKey.current !== filterKey) {
      setPage(1)
      prevFilterKey.current = filterKey
    }
  }, [filterKey])

  // Client-side filtering
  const filtered = useMemo(() => {
    return allInvoices.filter(inv => {
      if (search) {
        const q = search.toLowerCase()
        const hit =
          inv.number.toLowerCase().includes(q) ||
          inv.clientName.toLowerCase().includes(q) ||
          inv.clientEmail.toLowerCase().includes(q) ||
          inv.issuerName.toLowerCase().includes(q) ||
          (inv.notes ?? '').toLowerCase().includes(q)
        if (!hit) return false
      }
      if (statuses.length > 0 && !statuses.includes(inv.status)) return false
      if (dateFrom && new Date(inv.date) < new Date(dateFrom)) return false
      if (dateTo && new Date(inv.date) > new Date(dateTo + 'T23:59:59')) return false
      if (amountMin && inv.total < Number(amountMin)) return false
      if (amountMax && inv.total > Number(amountMax)) return false
      return true
    })
  }, [allInvoices, search, statuses, dateFrom, dateTo, amountMin, amountMax])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pagedInvoices = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const hasFilters = filterKey !== '||||'
  const { total, pagadas, totalFacturado } = stats
  const pendientes = total - pagadas

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mis Facturas</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {loading
              ? 'Cargando…'
              : total === 0
              ? 'Sin facturas aún'
              : `${total} factura${total !== 1 ? 's' : ''} en total`}
          </p>
        </div>
        <Link
          href="/invoices/new"
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Nueva factura
        </Link>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 border-l-4 border-l-slate-400 dark:border-l-slate-500 rounded-xl p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total facturas</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{total}</p>
            </div>
            <span className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-slate-500 dark:text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
              </svg>
            </span>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">{pendientes} pendiente{pendientes !== 1 ? 's' : ''}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 border-l-4 border-l-green-500 rounded-xl p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Facturas pagadas</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-1">{pagadas}</p>
            </div>
            <span className="w-10 h-10 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            </span>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
            {total > 0 ? `${Math.round((pagadas / total) * 100)}% del total` : 'Sin facturas'}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 border-l-4 border-l-blue-500 rounded-xl p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total facturado</p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-1">${totalFacturado.toLocaleString('es-MX')}</p>
            </div>
            <span className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            </span>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">MXN</p>
        </div>
      </div>

      {/* Sidebar + table */}
      <div className="flex items-start">
        <FilterSidebar />

        <div className="flex-1 min-w-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
              Historial
            </h2>
            {hasFilters && !loading && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {filtered.length === 0
                  ? 'Sin resultados'
                  : `${filtered.length} resultado${filtered.length !== 1 ? 's' : ''}`}
              </span>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <InvoiceList
              invoices={pagedInvoices}
              page={page}
              pageSize={PAGE_SIZE}
              total={filtered.length}
              totalPages={totalPages}
              onRefresh={() => setTick(t => t + 1)}
              onPageChange={setPage}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-16">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <HomeContent />
    </Suspense>
  )
}
