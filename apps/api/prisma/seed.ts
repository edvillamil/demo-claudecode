import fs from 'fs'
import path from 'path'
import { prisma } from '@/lib/prisma'

interface SeedItem {
  description: string
  quantity: number
  unitPrice: number
}

interface SeedInvoice {
  date: string
  dueDate: string
  status: string
  clientName: string
  clientEmail: string
  clientAddress: string
  issuerName: string
  issuerEmail: string
  issuerAddress: string
  taxRate: number
  notes?: string
  items: SeedItem[]
}

export async function main() {
  console.log('Limpiando base de datos...')
  await prisma.invoiceItem.deleteMany()
  await prisma.invoice.deleteMany()
  console.log('Base de datos limpiada.')

  const dataPath = path.join(process.cwd(), 'prisma', 'seed-data.json')
  const raw = fs.readFileSync(dataPath, 'utf-8')
  const invoices: SeedInvoice[] = JSON.parse(raw)

  console.log(`Creando ${invoices.length} facturas...`)

  for (let i = 0; i < invoices.length; i++) {
    const data = invoices[i]
    const number = `FAC-${String(i + 1).padStart(3, '0')}`

    const subtotal = data.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    )
    const tax = parseFloat((subtotal * (data.taxRate / 100)).toFixed(2))
    const total = parseFloat((subtotal + tax).toFixed(2))

    await prisma.invoice.create({
      data: {
        number,
        date: new Date(data.date),
        dueDate: new Date(data.dueDate),
        status: data.status,
        clientName: data.clientName,
        clientEmail: data.clientEmail,
        clientAddress: data.clientAddress,
        issuerName: data.issuerName,
        issuerEmail: data.issuerEmail,
        issuerAddress: data.issuerAddress,
        taxRate: data.taxRate,
        subtotal,
        tax,
        total,
        notes: data.notes ?? null,
        items: {
          create: data.items.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: parseFloat((item.quantity * item.unitPrice).toFixed(2)),
          })),
        },
      },
    })

    console.log(
      `  [${i + 1}/${invoices.length}] ${number} — ${data.clientName} — $${total.toLocaleString('es-MX')} MXN (${data.status})`
    )
  }

  console.log('\nSeed completado exitosamente.')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (err) => {
    console.error('Error durante el seed:', err)
    await prisma.$disconnect()
    process.exit(1)
  })
