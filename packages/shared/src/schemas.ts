import { z } from 'zod'

export const invoiceItemSchema = z.object({
  id: z.string().optional(),
  description: z.string().min(1, 'Descripción requerida').max(500),
  quantity: z.number().int('Debe ser un número entero').positive('Debe ser mayor a 0'),
  unitPrice: z.number().min(0, 'No puede ser negativo'),
})

export const invoiceFormSchema = z
  .object({
    date: z.string().date('Fecha inválida (usa formato YYYY-MM-DD)'),
    dueDate: z.string().date('Fecha inválida (usa formato YYYY-MM-DD)'),
    status: z.enum(['borrador', 'enviada', 'pagada']),
    issuerName: z.string().min(1, 'Nombre requerido').max(200),
    issuerEmail: z.string().email('Email inválido').or(z.literal('')),
    issuerAddress: z.string().min(1, 'Dirección requerida').max(500),
    clientName: z.string().min(1, 'Nombre requerido').max(200),
    clientEmail: z.string().email('Email inválido').or(z.literal('')),
    clientAddress: z.string().min(1, 'Dirección requerida').max(500),
    taxRate: z.number().min(0).max(100),
    notes: z.string().max(2000).optional(),
    items: z.array(invoiceItemSchema).min(1, 'Agrega al menos un producto'),
  })
  .refine((data) => data.dueDate >= data.date, {
    message: 'La fecha de vencimiento debe ser igual o posterior a la fecha de emisión',
    path: ['dueDate'],
  })

export type InvoiceItemFormValues = z.infer<typeof invoiceItemSchema>
export type InvoiceFormValues = z.infer<typeof invoiceFormSchema>
