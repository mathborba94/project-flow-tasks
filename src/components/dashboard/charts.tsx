'use client'

import { useState, useEffect } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts'

function DashboardCharts() {
  const [hoursData, setHoursData] = useState<Array<{ day: string; hours: number }>>([])
  const [tasksData, setTasksData] = useState<Array<{ day: string; opened: number; closed: number }>>([])
  const [weeklyAvg, setWeeklyAvg] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard/stats')
      .then(r => r.json())
      .then(data => {
        setHoursData(data.hoursByDay || [])
        setTasksData(data.tasksByDay || [])
        setWeeklyAvg(data.weeklyAverage || 0)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return null
  if (hoursData.length === 0 && tasksData.length === 0) return null

  const chartColors = {
    grid: '#27272a',
    text: '#71717a',
    brand: '#5c6ac4',
    green: '#10b981',
    blue: '#3b82f6',
  }

  return (
    <>
      {/* Hours Chart */}
      <div className="bg-zinc-950/50 border border-zinc-800/60 rounded-lg p-4 animate-fade-in-delay">
        <h2 className="text-sm font-medium text-zinc-200 mb-4">Horas alocadas (últimos 14 dias)</h2>
        {hoursData.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={hoursData}>
              <defs>
                <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chartColors.brand} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={chartColors.brand} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 10, fill: chartColors.text }}
                stroke={chartColors.grid}
                tickFormatter={(v: string) => v.slice(5)}
              />
              <YAxis
                tick={{ fontSize: 10, fill: chartColors.text }}
                stroke={chartColors.grid}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#18181b',
                  border: '1px solid #27272a',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: '#a1a1aa',
                }}
                labelStyle={{ color: '#fafafa', fontWeight: 500 }}
              />
              <Area
                type="monotone"
                dataKey="hours"
                stroke={chartColors.brand}
                fill="url(#colorHours)"
                strokeWidth={1.5}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[200px] flex items-center justify-center text-xs text-zinc-700">Sem dados de horas</div>
        )}
      </div>

      {/* Opened vs Closed */}
      <div className="bg-zinc-950/50 border border-zinc-800/60 rounded-lg p-4 animate-fade-in-delay-2">
        <h2 className="text-sm font-medium text-zinc-200 mb-4">Tarefas abertas vs encerradas</h2>
        {tasksData.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={tasksData}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 10, fill: chartColors.text }}
                stroke={chartColors.grid}
                tickFormatter={(v: string) => v.slice(5)}
              />
              <YAxis
                tick={{ fontSize: 10, fill: chartColors.text }}
                stroke={chartColors.grid}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#18181b',
                  border: '1px solid #27272a',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: '#a1a1aa',
                }}
                labelStyle={{ color: '#fafafa', fontWeight: 500 }}
              />
              <Bar dataKey="opened" fill={chartColors.blue} radius={[3, 3, 0, 0]} name="Abertas" />
              <Bar dataKey="closed" fill={chartColors.green} radius={[3, 3, 0, 0]} name="Encerradas" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[200px] flex items-center justify-center text-xs text-zinc-700">Sem dados de tarefas</div>
        )}
      </div>

      {/* Weekly Average */}
      <div className="col-span-1 lg:col-span-2 bg-zinc-950/50 border border-zinc-800/60 rounded-lg p-4 animate-fade-in-delay-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-medium text-zinc-200">Média de produção semanal</h2>
            <p className="text-xs text-zinc-500 mt-1">Tarefas concluídas por semana (últimas 4 semanas)</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-zinc-100 tabular-nums">{weeklyAvg}</p>
            <p className="text-xs text-zinc-500">tarefas/semana</p>
          </div>
        </div>
      </div>
    </>
  )
}

export default DashboardCharts
