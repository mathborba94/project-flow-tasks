/**
 * Script para recalcular TODAS as time entries importadas do Pipefy
 * com base no hourlyCost ATUAL de cada usuario.
 *
 * Corrige tanto entries com custo zerado quanto entries com custo desatualizado.
 *
 * Uso: npx tsx scripts/fix-all-time-entry-costs.ts
 */

import prisma from '../src/lib/prisma'

async function main() {
  console.log('🔍 Buscando time entries importadas do Pipefy...\n')

  const entries = await prisma.timeEntry.findMany({
    where: {
      description: { contains: 'Pipefy' },
    },
    include: {
      task: { select: { title: true } },
      user: { select: { id: true, name: true, hourlyCost: true } },
    },
    orderBy: { createdAt: 'asc' },
  })

  console.log(`📦 ${entries.length} time entries encontradas\n`)

  if (entries.length === 0) {
    console.log('✅ Nenhuma entry para corrigir!')
    return
  }

  // Agrupa por usuario
  const byUser: Record<string, typeof entries> = {}
  entries.forEach(e => {
    if (!byUser[e.user.id]) byUser[e.user.id] = []
    byUser[e.user.id].push(e)
  })

  let totalUpdated = 0
  let totalOldCost = 0
  let totalNewCost = 0

  for (const [userId, userEntries] of Object.entries(byUser)) {
    const user = userEntries[0].user
    const hourlyCost = Number(user.hourlyCost)

    console.log(`👤 ${user.name} | hourlyCost: R$ ${hourlyCost}/h | ${userEntries.length} entries`)

    if (hourlyCost === 0) {
      console.log(`   ⚠️  hourlyCost = 0, pulando...\n`)
      continue
    }

    for (const entry of userEntries) {
      const oldCost = Number(entry.costSnapshot)
      const newCost = hourlyCost * (entry.minutes / 60)
      const diff = newCost - oldCost

      if (Math.abs(diff) < 0.01) {
        // Ja esta correto
        continue
      }

      await prisma.timeEntry.update({
        where: { id: entry.id },
        data: { costSnapshot: newCost },
      })

      totalUpdated++
      totalOldCost += oldCost
      totalNewCost += newCost

      const hours = entry.minutes / 60
      const signal = diff > 0 ? '↑' : '↓'
      console.log(`   ${signal} "${entry.task.title}" - ${entry.minutes}min (${hours.toFixed(1)}h) | R$ ${oldCost.toFixed(2)} → R$ ${newCost.toFixed(2)} (${diff > 0 ? '+' : ''}R$ ${diff.toFixed(2)})`)
    }
    console.log('')
  }

  console.log('='.repeat(70))
  console.log(`✅ ${totalUpdated} entries atualizadas`)
  console.log(`\n💰 Custo total antigo:    R$ ${totalOldCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)
  console.log(`💰 Custo total corrigido: R$ ${totalNewCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)
  console.log(`📈 Diferenca:            R$ ${(totalNewCost - totalOldCost).toLocaleString('pt-BR', { minimumFractionDigits: 2, signDisplay: 'always' })}`)
}

main()
  .catch(e => {
    console.error('Erro fatal:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
