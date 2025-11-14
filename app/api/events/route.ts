import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/utils/auth'
import { eventSchema } from '@/lib/validations/certificate'

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ events: data })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch events' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAdmin()
    const supabase = await createClient()
    
    const body = await request.json()
    const validatedData = eventSchema.parse(body)
    
    // Check if event code already exists
    const { data: existingEvent } = await supabase
      .from('events')
      .select('event_code')
      .eq('event_code', validatedData.event_code)
      .single()
    
    if (existingEvent) {
      return NextResponse.json(
        { error: 'Event code already exists' },
        { status: 400 }
      )
    }
    
    const { data, error } = await (supabase as any)
      .from('events')
      .insert({
        ...validatedData,
        created_by: user.id
      })
      .select()
      .single()
    
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ event: data }, { status: 201 })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: error.message || 'Failed to create event' },
      { status: 500 }
    )
  }
}

