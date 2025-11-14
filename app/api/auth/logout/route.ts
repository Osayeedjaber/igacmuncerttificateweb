import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(_request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }
    
    const response = NextResponse.json({ message: 'Logged out successfully' })
    response.cookies.set('igac-role', '', { maxAge: 0, path: '/' })
    response.cookies.set('igac-status', '', { maxAge: 0, path: '/' })
    return response
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to logout' },
      { status: 500 }
    )
  }
}

