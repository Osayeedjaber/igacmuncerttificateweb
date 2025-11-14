import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, requestPassword } = body

    // Validate email
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      )
    }

    // Validate password
    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Get signup password from secrets
    const { data: signupSecret, error: secretError } = await supabase
      .from('secrets')
      .select('value')
      .eq('key', 'signup_password')
      .single() as { data: { value: string } | null, error: any }

    if (secretError || !signupSecret) {
      return NextResponse.json(
        { error: 'Failed to verify password. Please contact system administrator.' },
        { status: 500 }
      )
    }

    // Verify request password
    if (requestPassword !== signupSecret.value) {
      return NextResponse.json(
        { error: 'Invalid request password' },
        { status: 403 }
      )
    }

    // Check if user already exists in public.users table
    const { data: existingProfile } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()
    
    if (existingProfile) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 400 }
      )
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm since we're using admin API
    })

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: authError?.message || 'Failed to create account' },
        { status: 500 }
      )
    }

    // Wait a bit for the trigger to potentially create the profile
    await new Promise(resolve => setTimeout(resolve, 500))

    // Check if profile was created by trigger
    const { data: existingProfileAfterAuth } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    if (existingProfileAfterAuth) {
      // Profile already exists (created by trigger), just return success
      return NextResponse.json({
        message: 'Access request submitted successfully. A super admin will review your request.',
        user_id: authData.user.id,
      })
    }

    // Create user profile with pending_approval status if trigger didn't create it
    const { data: profileData, error: profileError } = await (supabase as any)
      .from('users')
      .insert({
        id: authData.user.id,
        email: authData.user.email!,
        role: 'mod', // Default to mod, super admin can change later
        account_status: 'pending_approval',
      })
      .select()
      .single()

    if (profileError) {
      console.error('Profile creation error:', profileError)
      // Check if it's a duplicate key error (profile was created by trigger)
      if (profileError.code === '23505' || profileError.message?.includes('duplicate')) {
        // Profile already exists, return success
        return NextResponse.json({
          message: 'Access request submitted successfully. A super admin will review your request.',
          user_id: authData.user.id,
        })
      }
      
      // If profile creation fails, try to delete the auth user
      try {
        await supabase.auth.admin.deleteUser(authData.user.id)
      } catch (deleteError) {
        console.error('Failed to delete auth user after profile creation failure:', deleteError)
      }
      return NextResponse.json(
        { 
          error: 'Failed to create user profile',
          details: profileError.message || 'Unknown error',
          code: profileError.code
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Access request submitted successfully. A super admin will review your request.',
      user_id: authData.user.id,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to process request' },
      { status: 500 }
    )
  }
}

