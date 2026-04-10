/**
 * Script para recalcular o costSnapshot das time entries importadas do Pipefy.
 * Na importacao, o hourlyCost do Felipe era 0, entao todas as entries ficaram com custo zerado.
 * Agora que o hourlyCost foi definido (R$ 44/h), recalculamos os custos retroativamente.
 *
 * Uso: npx tsx scripts/fix-time-entry-costs.ts
 */

import prisma from '../src/lib/prisma'

// hourlyCost atual de cada usuario (R$/hora)
const USER_HOURLY_COST: Record<string, number> = {
  'cmnt1ktms000104i6mjip8p34': 44,   // Felipe Falcao
  'cmnpzldji000104i0m15efu4i': 137,  // Matheus Borba
}

async function main() {
  console.log('🔍 Buscando time entries importadas do Pipefy com custo zerado...\n')

  const entries = await prisma.timeEntry.findMany({
    where: {
      description: { contains: 'Pipefy' },
      costSnapshot: 0,
    },
    include: {
      task: { select: { title: true } },
      user: { select: { id: true, name: true, hourlyCost: true } },
    },
    orderBy: { createdAt: 'asc' },
  })

  console.log(`📦 ${entries.length} time entries encontradas com costSnapshot = 0\n`)

  if (entries.length === 0) {
    console.log('✅ Nenhuma entry para corrigir!')
    return
  }

  // Mostra distribuicao por usuario
  const userCount: Record<string, number> = {}
  entries.forEach(e => {
    userCount[e.user.name] = (userCount[e.user.name] || 0) + 1
  })
  console.log('📊 Distribuicao por usuario:')
  Object.entries(userCount).forEach(([name, count]) => {
    const userId = entries.find(e => e.user.name === name)?.user.id
    const hourlyCost = USER_HOURLY_COST[userId || ''] || Number(entries.find(e => e.user.name === name)?.user.hourlyCost || 0)
    console.log(`   ${name}: ${count} entries | hourlyCost atual: R$ ${hourlyCost}/h`)
  })

  // Recalcula e atualiza
  console.log('\n⚙️  Recalculando costSnapshot...\n')
  let updated = 0
  let skipped = 0
  let totalOldCost = 0
  let totalNewCost = 0

  for (const entry of entries) {
    const hourlyCost = USER_HOURLY_COST[entry.user.id]
    if (hourlyCost === undefined || hourlyCost === 0) {
      skipped++
      console.log(`   ⚠️  "${entry.task.title}" - ${entry.user.name} sem hourlyCost definido`)
      continue
    }

    const oldCost = Number(entry.costSnapshot)
    const newCost = hourlyCost * (entry.minutes / 60)

    totalOldCost += oldCost
    totalNewCost += newCost

    await prisma.timeEntry.update({
      where: { id: entry.id },
      data: { costSnapshot: newCost },
    })

    updated++
    const hours = entry.minutes / 60
    console.log(`   ✅ "${entry.task.title}" - ${entry.minutes}min (${hours.toFixed(1)}h) | R$ ${oldCost.toFixed(2)} → R$ ${newCost.toFixed(2)}`)
  }

  console.log('\n' + '='.repeat(60))
  console.log(`✅ ${updated} entries atualizadas`)
  console.log(`⚠️  ${skipped} entries ignoradas (sem hourlyCost)`)
  console.log(`\n💰 Custo total antigo: R$ ${totalOldCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)
  console.log(`💰 Custo total corrigido: R$ ${totalNewCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)
  console.log(`📈 Diferenca: R$ ${(totalNewCost - totalOldCost).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)
}

main()
  .catch(e => {
    console.error('Erro fatal:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
