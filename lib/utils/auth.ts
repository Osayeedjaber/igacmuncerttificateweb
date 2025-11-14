import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function getCurrentUser() {
  const supabase = await createClient()
  const cookieStore = await cookies()
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return null
  }
  
  const role = cookieStore.get('igac-role')?.value ?? ''
  const status = cookieStore.get('igac-status')?.value ?? ''
  
  if (!role || status !== 'approved') {
    return null
  }
  
  return {
    ...user,
    role,
    account_status: status
  }
}

export async function requireAuth(requiredRole?: 'super_admin' | 'admin' | 'mod') {
  const user = await getCurrentUser()
  
      if (!user) {
        redirect('/admin/login')
      }
  
  if (requiredRole) {
    const roleHierarchy: Record<string, number> = {
      'mod': 1,
      'admin': 2,
      'super_admin': 3
    }
    
        if ((roleHierarchy[user.role] || 0) < roleHierarchy[requiredRole]) {
          redirect('/admin/login')
        }
  }
  
  return user
}

export async function requireAdmin() {
  return requireAuth('admin')
}

export async function requireSuperAdmin() {
  return requireAuth('super_admin')
}

// Helper to create user record when they sign up
export async function createUserRecord(userId: string, email: string, role: 'super_admin' | 'admin' | 'mod' = 'mod') {
  const supabase = await createClient()
  
  const { error } = await (supabase as any)
    .from('users')
    .insert({
      id: userId,
      email,
      role,
      account_status: 'pending_approval'
    })
  
  return { error }
}

