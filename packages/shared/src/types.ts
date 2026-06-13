export type InvoiceStatus = 'borrador' | 'enviada' | 'pagada'

export interface InvoiceItemInput {
  id?: string
  description: string
  quantity: number
  unitPrice: number
}

export interface InvoiceInput {
  number?: string
  date: string
  dueDate: string
  status: InvoiceStatus
  clientName: string
  clientEmail: string
  clientAddress: string
  issuerName: string
  issuerEmail: string
  issuerAddress: string
  taxRate: number
  notes?: string
  items: InvoiceItemInput[]
}

// Internal type used by service/repository after server-side total computation
export interface InvoiceComputedData extends InvoiceInput {
  subtotal: number
  tax: number
  total: number
  items: (InvoiceItemInput & { total: number })[]
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface InvoiceWithItems {
  id: string
  number: string
  date: Date
  dueDate: Date
  status: string
  clientName: string
  clientEmail: string
  clientAddress: string
  issuerName: string
  issuerEmail: string
  issuerAddress: string
  taxRate: number
  subtotal: number
  tax: number
  total: number
  notes: string | null
  createdAt: Date
  updatedAt: Date
  items: {
    id: string
    description: string
    quantity: number
    unitPrice: number
    total: number
    invoiceId: string
  }[]
}
