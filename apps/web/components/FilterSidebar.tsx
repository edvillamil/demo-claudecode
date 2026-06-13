'use client'

import { useEffect, useState } from 'react'
import { useFilterStore } from '@/lib/filterStore'

const STATUSES = [
  { value: 'borrador', label: 'Borrador', dot: 'bg-gray-400' },
  { value: 'enviada',  label: 'Enviada',  dot: 'bg-amber-500' },
  { value: 'pagada',   label: 'Pagada',   dot: 'bg-green-500' },
]

const inputCls =
  'w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/60 text-gray-800 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors'

export default function FilterSidebar() {
  const [open, setOpen] = useState(true)
  const [searchInput, setSearchInput] = useState('')

  const {
    statuses, dateFrom, dateTo, amountMin, amountMax,
    setSearch, setStatuses, setDateFrom, setDateTo, setAmountMin, setAmountMax,
    clearFilters, activeCount,
  } = useFilterStore()

  // Debounce search → store
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 320)
    return () => clearTimeout(t)
  }, [searchInput, setSearch])

  const count = activeCount()

  const toggleStatus = (val: string) =>
    setStatuses(statuses.includes(val) ? statuses.filter(s => s !== val) : [...statuses, val])

  const handleClear = () => {
    clearFilters()
    setSearchInput('')
  }

  return (
    <div className="flex items-start flex-shrink-0">
      {/* ── Collapsible panel ── */}
      <div
        className={`overflow-hidden flex-shrink-0 transition-all duration-250 ease-in-out ${
          open ? 'w-56 opacity-100 mr-2' : 'w-0 opacity-0 mr-0'
        }`}
      >
        <div className="w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-4 space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">
              Filtros
            </span>
            {count > 0 && (
              <button
                onClick={handleClear}
                className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
              >
                Limpiar todo
              </button>
            )}
          </div>

          {/* Search */}
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Búsqueda</p>
            <div className="relative">
              <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
              <input
                type="text"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                placeholder="N°, cliente, notas…"
                className={`${inputCls} pl-8`}
              />
              {searchInput && (
                <button
                  onClick={() => { setSearchInput(''); setSearch('') }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Estado */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Estado</p>
            <div className="space-y-1.5">
              {STATUSES.map(s => (
                <label key={s.value} className="flex items-center gap-2.5 cursor-pointer group select-none">
                  <input
                    type="checkbox"
                    checked={statuses.includes(s.value)}
                    onChange={() => toggleStatus(s.value)}
                    className="w-3.5 h-3.5 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 focus:ring-1 cursor-pointer"
                  />
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.dot}`} />
                  <span className="text-xs text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                    {s.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Fechas */}
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Fecha de emisión</p>
            <div className="space-y-1.5">
              <input
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                className={inputCls}
                title="Desde"
              />
              <input
                type="date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                className={inputCls}
                title="Hasta"
              />
              {(dateFrom || dateTo) && (
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {dateFrom && dateTo
                    ? `${dateFrom} → ${dateTo}`
                    : dateFrom
                    ? `Desde ${dateFrom}`
                    : `Hasta ${dateTo}`}
                </p>
              )}
            </div>
          </div>

          {/* Monto */}
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Monto total</p>
            <div className="space-y-1.5">
              <input
                type="number"
                value={amountMin}
                onChange={e => setAmountMin(e.target.value)}
                placeholder="Mínimo"
                min={0}
                className={inputCls}
              />
              <input
                type="number"
                value={amountMax}
                onChange={e => setAmountMax(e.target.value)}
                placeholder="Máximo"
                min={0}
                className={inputCls}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Toggle button ── */}
      <button
        onClick={() => setOpen(o => !o)}
        title={open ? 'Ocultar filtros' : 'Mostrar filtros'}
        className="relative mt-[18px] mr-4 flex-shrink-0 w-7 h-7 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 shadow-sm flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white hover:shadow-md transition-all"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? '' : 'rotate-180'}`}
          fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>

        {/* Active filter badge when collapsed */}
        {!open && count > 0 && (
          <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-blue-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
            {count}
          </span>
        )}
      </button>
    </div>
  )
}
