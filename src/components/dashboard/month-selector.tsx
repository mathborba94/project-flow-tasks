'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect, useMemo } from 'react'
import { Calendar } from 'lucide-react'

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

export default function DashboardMonthSelector() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const now = new Date()

  // Parse month from URL
  const parsedMonth = useMemo(() => {
    const monthParam = searchParams.get('month')
    if (monthParam) {
      const [year, monthNum] = monthParam.split('-').map(Number)
      return { month: monthNum - 1, year }
    }
    return { month: now.getMonth(), year: now.getFullYear() }
  }, [searchParams])

  // Local state to avoid race condition during dropdown changes
  const [localMonth, setLocalMonth] = useState(parsedMonth.month)
  const [localYear, setLocalYear] = useState(parsedMonth.year)

  // Sync local state when URL changes
  useEffect(() => {
    setLocalMonth(parsedMonth.month)
    setLocalYear(parsedMonth.year)
  }, [parsedMonth])

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i)

  const navigateToMonth = (month: number, year: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}`
    const params = new URLSearchParams()
    // Preserve other params
    searchParams.forEach((value, key) => {
      if (key !== 'month') params.set(key, value)
    })
    params.set('month', dateStr)
    router.push(`/dashboard?${params.toString()}`)
  }

  const isCurrentMonth = localMonth === now.getMonth() && localYear === now.getFullYear()

  const handleMonthChange = (month: number) => {
    setLocalMonth(month)
    navigateToMonth(month, localYear)
  }

  const handleYearChange = (year: number) => {
    setLocalYear(year)
    navigateToMonth(localMonth, year)
  }

  return (
    <div className="flex items-center gap-2">
      <Calendar className="w-3.5 h-3.5 text-zinc-600" />
      <select
        value={localMonth}
        onChange={(e) => handleMonthChange(Number(e.target.value))}
        className="bg-zinc-900/60 border border-zinc-800 rounded-md px-2 py-1 text-xs dark:text-zinc-200 text-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-700"
      >
        {MONTHS.map((m, i) => (
          <option key={i} value={i}>{m}</option>
        ))}
      </select>
      <select
        value={localYear}
        onChange={(e) => handleYearChange(Number(e.target.value))}
        className="bg-zinc-900/60 border border-zinc-800 rounded-md px-2 py-1 text-xs dark:text-zinc-200 text-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-700"
      >
        {years.map(y => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>
      {!isCurrentMonth && (
        <button
          onClick={() => {
            const params = new URLSearchParams()
            searchParams.forEach((value, key) => {
              if (key !== 'month') params.set(key, value)
            })
            // Delete month param to go to current month
            router.push(`/dashboard${params.toString() ? `?${params.toString()}` : ''}`)
          }}
          className="text-[10px] text-zinc-600 hover:text-zinc-400 underline"
        >
          Mês atual
        </button>
      )}
    </div>
  )
}
