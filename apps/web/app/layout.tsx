import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import Link from 'next/link'
import ThemeToggle from '@/components/ThemeToggle'
import ToastContainer from '@/components/ToastContainer'
import NavBar from '@/components/NavBar'
import { AuthProvider } from '@/lib/authContext'
import './globals.css'

const geist = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Facturas',
  description: 'Aplicación de gestión de facturas',
}

const themeScript = `
try {
  const t = localStorage.getItem('theme')
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  if (t === 'dark' || (!t && prefersDark)) document.documentElement.classList.add('dark')
} catch {}
`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${geist.variable} h-full antialiased`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full bg-gray-50 dark:bg-gray-900 flex flex-col transition-colors duration-200">
        <AuthProvider>
          <header className="sticky top-0 z-10 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
                <span className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                  </svg>
                </span>
                <span className="font-bold text-lg text-gray-900 dark:text-white">Facturas</span>
              </Link>

              <div className="flex items-center gap-2">
                <ThemeToggle />
                <NavBar />
              </div>
            </div>
          </header>
          <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">{children}</main>
          <ToastContainer />
        </AuthProvider>
      </body>
    </html>
  )
}
