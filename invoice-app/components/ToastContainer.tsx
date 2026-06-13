'use client'

import { useEffect, useState } from 'react'
import { useToastStore, type Toast, type ToastType } from '@/lib/toastStore'

const CONFIG: Record<ToastType, { border: string; iconCls: string; bar: string; icon: React.ReactNode }> = {
  success: {
    border: 'border-l-green-500',
    iconCls: 'text-green-500',
    bar: 'bg-green-500',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
    ),
  },
  error: {
    border: 'border-l-red-500',
    iconCls: 'text-red-500',
    bar: 'bg-red-500',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
    ),
  },
  info: {
    border: 'border-l-blue-500',
    iconCls: 'text-blue-500',
    bar: 'bg-blue-500',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
      </svg>
    ),
  },
  warning: {
    border: 'border-l-amber-500',
    iconCls: 'text-amber-500',
    bar: 'bg-amber-500',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
      </svg>
    ),
  },
}

function ToastItem({ id, type, title, message }: Toast) {
  const remove = useToastStore((s) => s.remove)
  const [visible, setVisible] = useState(false)
  const cfg = CONFIG[type]

  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(raf)
  }, [])

  const dismiss = () => {
    setVisible(false)
    setTimeout(() => remove(id), 300)
  }

  return (
    <div
      className={`
        relative overflow-hidden w-80 bg-white dark:bg-gray-800
        border border-gray-200 dark:border-gray-700 border-l-4 ${cfg.border}
        rounded-xl shadow-lg
        transition-all duration-300 ease-out
        ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}
      `}
    >
      <div className="flex items-start gap-3 px-4 py-3.5">
        <span className={`mt-0.5 flex-shrink-0 ${cfg.iconCls}`}>{cfg.icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-white leading-snug">{title}</p>
          {message && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">{message}</p>
          )}
        </div>
        <button
          onClick={dismiss}
          aria-label="Cerrar"
          className="flex-shrink-0 p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div
        className={`h-0.5 ${cfg.bar} opacity-60`}
        style={{ animation: 'toast-shrink 4s linear forwards' }}
      />
    </div>
  )
}

export default function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts)

  return (
    <div
      aria-live="polite"
      aria-label="Notificaciones"
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 items-end pointer-events-none"
    >
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem {...t} />
        </div>
      ))}
    </div>
  )
}
