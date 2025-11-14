import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireSuperAdmin } from '@/lib/utils/auth'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireSuperAdmin()
    const { id } = await params
    const body = await request.json()
    const { new_role, password } = body

    // Validate new role
    if (!['super_admin', 'admin', 'mod'].includes(new_role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be super_admin, admin, or mod' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const adminSupabase = createAdminClient()

    // Get current user data
    const { data: targetUser, error: userError } = await adminSupabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single() as { data: any, error: any }

    if (userError || !targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // If changing to super_admin or admin, require password
    if ((new_role === 'super_admin' || new_role === 'admin') && targetUser.role !== new_role) {
      if (!password) {
        return NextResponse.json(
          { error: 'Password required to change role to admin or super_admin' },
          { status: 403 }
        )
      }

      // Get role change password from secrets
      const { data: secret, error: secretError } = await adminSupabase
        .from('secrets')
        .select('value')
        .eq('key', 'role_change_password')
        .single() as { data: { value: string } | null, error: any }

      if (secretError || !secret) {
        return NextResponse.json(
          { error: 'Failed to verify password. Please contact system administrator.' },
          { status: 500 }
        )
      }

      // Verify password
      if (password !== secret.value) {
        return NextResponse.json(
          { error: 'Invalid password' },
          { status: 403 }
        )
      }
    }

    // Update user role
    const { data: updatedUser, error: updateError } = await (adminSupabase as any)
      .from('users')
      .update({
        role: new_role,
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message || 'Failed to update user role' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: `User role updated to ${new_role} successfully`,
      user: updatedUser,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to change user role' },
      { status: 500 }
    )
  }
}

