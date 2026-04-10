import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserWithOrg } from '@/services/auth'
import * as timeEntryService from '@/services/time-entry'
import { createTimeEntrySchema, timeEntryFilterSchema } from '@/types/time-entry'

export async function GET(request: NextRequest) {
  try {
    const { organizationId } = await getCurrentUserWithOrg()
    const { searchParams } = new URL(request.url)
    
    const filter = timeEntryFilterSchema.parse({
      taskId: searchParams.get('taskId') ?? undefined,
      projectId: searchParams.get('projectId') ?? undefined,
      userId: searchParams.get('userId') ?? undefined,
      startDate: searchParams.get('startDate') ?? undefined,
      endDate: searchParams.get('endDate') ?? undefined,
    })

    const entries = await timeEntryService.listTimeEntries(organizationId, filter)
    return NextResponse.json(entries)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { organizationId, user } = await getCurrentUserWithOrg()
    const body = await request.json()
    const data = createTimeEntrySchema.parse(body)

    const entry = await timeEntryService.createTimeEntry(organizationId, user.id, data)
    return NextResponse.json(entry, { status: 201 })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}