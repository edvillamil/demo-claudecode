import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

const CLIENTS = [
  { name: 'Grupo Tecnología MX', email: 'contacto@grupotecmx.com', address: 'Av. Insurgentes Sur 1235, CDMX' },
  { name: 'Distribuidora Norteña SA', email: 'ventas@distrnorte.mx', address: 'Blvd. Díaz Ordaz 890, Monterrey' },
  { name: 'Servicios Integrales GDL', email: 'admin@sigdl.com.mx', address: 'Av. López Mateos 450, Guadalajara' },
  { name: 'Comercializadora del Pacífico', email: 'facturacion@compac.mx', address: 'Calzada Zapata 2100, Mazatlán' },
  { name: 'Consultores Asociados DF', email: 'billing@cadf.mx', address: 'Paseo de la Reforma 362, CDMX' },
  { name: 'Inmobiliaria Torres SA', email: 'cuentas@intorres.mx', address: 'Av. Constitución 670, Monterrey' },
  { name: 'Logística Express Bajío', email: 'pagos@logbajio.com', address: 'Blvd. Campestre 1800, León, Gto' },
  { name: 'Alimentos del Norte SA', email: 'finanzas@alimnorte.mx', address: 'Carretera a Laredo Km 5, Nuevo Laredo' },
  { name: 'Manufactura Precisa GDL', email: 'cuentas@manuprecisa.mx', address: 'Parque Industrial El Salto, Jalisco' },
  { name: 'Digital Media Agency', email: 'billing@dmagency.mx', address: 'Masaryk 189, Polanco, CDMX' },
]

const SERVICES = [
  { description: 'Desarrollo de software a medida', unitPrice: 12000 },
  { description: 'Consultoría estratégica', unitPrice: 8500 },
  { description: 'Diseño UX/UI', unitPrice: 6500 },
  { description: 'Infraestructura cloud (mensual)', unitPrice: 4200 },
  { description: 'Soporte técnico especializado', unitPrice: 3800 },
  { description: 'Capacitación y formación (por sesión)', unitPrice: 2500 },
  { description: 'Auditoría de sistemas', unitPrice: 9000 },
  { description: 'Integración de APIs', unitPrice: 7200 },
  { description: 'Mantenimiento preventivo', unitPrice: 3200 },
  { description: 'Análisis de datos y reportes', unitPrice: 5500 },
  { description: 'Migración de base de datos', unitPrice: 11000 },
  { description: 'Testing y QA', unitPrice: 4800 },
  { description: 'DevOps y CI/CD', unitPrice: 7800 },
  { description: 'Seguridad informática', unitPrice: 9500 },
  { description: 'Licencia de software anual', unitPrice: 15000 },
]

const STATUSES = ['borrador', 'borrador', 'enviada', 'enviada', 'pagada', 'pagada', 'pagada']

function rng(seed: number) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 0xffffffff
  }
}

function pick<T>(arr: T[], rand: () => number): T {
  return arr[Math.floor(rand() * arr.length)]
}

async function main() {
  const password = await bcrypt.hash('Test1234!', 12)
  const user = await prisma.user.upsert({
    where: { email: 'edward@test.com' },
    update: {},
    create: { name: 'Edward Villamil', email: 'edward@test.com', password },
  })
  console.log(`Usuario: ${user.email} (${user.id})`)

  await prisma.invoiceItem.deleteMany({ where: { invoice: { userId: user.id } } })
  await prisma.invoice.deleteMany({ where: { userId: user.id } })
  console.log('Facturas anteriores eliminadas.')

  const baseDate = new Date('2025-01-01')
  let created = 0

  for (let i = 0; i < 100; i++) {
    const rand = rng(i * 7919 + 42)

    const dayOffset = Math.floor(rand() * 365 * 1.4)
    const date = new Date(baseDate)
    date.setDate(date.getDate() + dayOffset)

    const dueDate = new Date(date)
    dueDate.setDate(dueDate.getDate() + pick([15, 30, 30, 45, 60], rand))

    const client = pick(CLIENTS, rand)
    const status = pick(STATUSES, rand)
    const numItems = 1 + Math.floor(rand() * 4)

    const items: { description: string; quantity: number; unitPrice: number; total: number }[] = []
    for (let j = 0; j < numItems; j++) {
      const svc = pick(SERVICES, rand)
      const qty = parseFloat((0.5 + rand() * 4.5).toFixed(1))
      const unit = svc.unitPrice * (0.85 + rand() * 0.3)
      const rounded = Math.round(unit / 50) * 50
      items.push({
        description: svc.description,
        quantity: qty,
        unitPrice: rounded,
        total: parseFloat((qty * rounded).toFixed(2)),
      })
    }

    const subtotal = parseFloat(items.reduce((s, it) => s + it.total, 0).toFixed(2))
    const taxRate = 16
    const tax = parseFloat((subtotal * taxRate / 100).toFixed(2))
    const total = parseFloat((subtotal + tax).toFixed(2))

    const number = `FAC-${String(i + 1).padStart(3, '0')}`

    await prisma.invoice.create({
      data: {
        number,
        date,
        dueDate,
        status,
        clientName: client.name,
        clientEmail: client.email,
        clientAddress: client.address,
        issuerName: 'Edward Villamil',
        issuerEmail: 'edward@test.com',
        issuerAddress: 'Insurgentes Norte 1228, CDMX',
        taxRate,
        subtotal,
        tax,
        total,
        userId: user.id,
        items: { create: items },
      },
    })

    created++
    if (created % 10 === 0) console.log(`  ${created}/100 facturas creadas…`)
  }

  console.log(`\n✓ ${created} facturas creadas para ${user.email}`)
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err)
    await prisma.$disconnect()
    process.exit(1)
  })
