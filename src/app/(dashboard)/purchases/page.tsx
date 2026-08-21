import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import PurchasesClient from './PurchasesClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function PurchasesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    redirect('/dashboard')
  }

  // Fetch Purchases
  const { data: purchases } = await supabase
    .from('purchases')
    .select('*')
    .order('created_at', { ascending: false })

  // Fetch Profiles (for assignment)
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, email')

  // Fetch Pipelines
  const { data: pipelines } = await supabase
    .from('pipelines')
    .select('id, name')
    .order('created_at', { ascending: true })

  // Fetch Stages
  const { data: stages } = await supabase
    .from('pipeline_stages')
    .select('id, pipeline_id, name')
    .order('order_index', { ascending: true })

  return (
    <div className="max-w-7xl mx-auto">
      <PurchasesClient 
        initialPurchases={purchases || []} 
        profiles={profiles || []}
        pipelines={pipelines || []}
        stages={stages || []}
      />
    </div>
  )
}


