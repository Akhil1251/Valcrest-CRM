import { createClient } from '@/utils/supabase/server'
import InquiriesClient from './InquiriesClient'

export default async function InquiriesPage() {
  const supabase = await createClient()

  // Fetch inquiries from database, ordering by newest first
  const { data: inquiries, error } = await supabase
    .from('inquiries')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching inquiries:', error)
  }

  return <InquiriesClient inquiries={inquiries || []} />
}
