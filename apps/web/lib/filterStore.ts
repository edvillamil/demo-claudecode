import { create } from 'zustand'

export interface InvoiceFilters {
  search: string
  statuses: string[]
  dateFrom: string
  dateTo: string
  amountMin: string
  amountMax: string
}

interface FilterStore extends InvoiceFilters {
  setSearch: (v: string) => void
  setStatuses: (v: string[]) => void
  setDateFrom: (v: string) => void
  setDateTo: (v: string) => void
  setAmountMin: (v: string) => void
  setAmountMax: (v: string) => void
  clearFilters: () => void
  activeCount: () => number
}

const INITIAL: InvoiceFilters = {
  search: '',
  statuses: [],
  dateFrom: '',
  dateTo: '',
  amountMin: '',
  amountMax: '',
}

export const useFilterStore = create<FilterStore>((set, get) => ({
  ...INITIAL,
  setSearch: (search) => set({ search }),
  setStatuses: (statuses) => set({ statuses }),
  setDateFrom: (dateFrom) => set({ dateFrom }),
  setDateTo: (dateTo) => set({ dateTo }),
  setAmountMin: (amountMin) => set({ amountMin }),
  setAmountMax: (amountMax) => set({ amountMax }),
  clearFilters: () => set(INITIAL),
  activeCount: () => {
    const { search, statuses, dateFrom, dateTo, amountMin, amountMax } = get()
    return (
      (search ? 1 : 0) +
      statuses.length +
      (dateFrom ? 1 : 0) +
      (dateTo ? 1 : 0) +
      (amountMin ? 1 : 0) +
      (amountMax ? 1 : 0)
    )
  },
}))
