import { NextRequest, NextResponse } from 'next/server'
import { getUserAndValidateOrg } from '@/services/auth'
import * as orgService from '@/services/organization'
import { createOrganizationSchema } from '@/types/organization'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const organization = await orgService.getOrganizationById(id)
    
    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    return NextResponse.json(organization)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await getUserAndValidateOrg(id)
    
    const body = await request.json()
    const data = createOrganizationSchema.partial().parse(body)
    
    const organization = await orgService.updateOrganization(id, data)
    return NextResponse.json(organization)
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}