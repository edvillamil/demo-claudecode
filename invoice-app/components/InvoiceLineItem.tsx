'use client'

import { useWatch, type Control, type UseFormRegister, type FieldErrors } from 'react-hook-form'
import type { InvoiceFormValues, InvoiceItemFormValues } from '@/lib/schemas'

interface Props {
  index: number
  register: UseFormRegister<InvoiceFormValues>
  control: Control<InvoiceFormValues>
  errors?: FieldErrors<InvoiceItemFormValues>
  onRemove: () => void
  canRemove: boolean
}

export default function InvoiceLineItem({ index, register, control, errors, onRemove, canRemove }: Props) {
  const { quantity, unitPrice } = useWatch({ control, name: `items.${index}` })
  const total = (quantity || 0) * (unitPrice || 0)

  const inputCls =
    'w-full border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:text-white'

  return (
    <tr>
      <td className="px-2 py-1">
        <input
          type="text"
          {...register(`items.${index}.description`)}
          placeholder="Descripción del producto/servicio"
          className={inputCls}
        />
        {errors?.description && (
          <p className="text-red-500 text-xs mt-0.5">{errors.description.message}</p>
        )}
      </td>
      <td className="px-2 py-1 w-24">
        <input
          type="number"
          min="0"
          step="0.01"
          {...register(`items.${index}.quantity`, { valueAsNumber: true })}
          className={`${inputCls} text-right`}
        />
        {errors?.quantity && (
          <p className="text-red-500 text-xs mt-0.5">{errors.quantity.message}</p>
        )}
      </td>
      <td className="px-2 py-1 w-32">
        <input
          type="number"
          min="0"
          step="0.01"
          {...register(`items.${index}.unitPrice`, { valueAsNumber: true })}
          className={`${inputCls} text-right`}
        />
        {errors?.unitPrice && (
          <p className="text-red-500 text-xs mt-0.5">{errors.unitPrice.message}</p>
        )}
      </td>
      <td className="px-2 py-1 w-32 text-right text-sm font-medium dark:text-gray-200">
        ${total.toFixed(2)}
      </td>
      <td className="px-2 py-1 w-10 text-center">
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="text-red-400 hover:text-red-600 font-bold text-lg leading-none"
          >
            ×
          </button>
        )}
      </td>
    </tr>
  )
}
