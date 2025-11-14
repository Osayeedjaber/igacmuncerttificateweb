import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/utils/auth'
import { redirect } from 'next/navigation'
import CertificateDetailView from '@/components/dashboard/CertificateDetailView'

export default async function CertificateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await requireAdmin()
  const { id } = await params
  const supabase = await createClient()

  const { data: certificate, error } = await supabase
    .from('certificates')
    .select(`
      *,
      events (*),
      certificate_metadata (*)
    `)
    .eq('id', id)
    .single()

  if (error || !certificate) {
    redirect('/dashboard')
  }

  return <CertificateDetailView certificate={certificate} user={user} />
}

