import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { CheckCircle2, IndianRupee } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function PurchasesPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check if admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    redirect('/dashboard') // Only admins can access purchases
  }

  const { data: purchases, error } = await supabase
    .from('purchases')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Purchases</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">View all successful package purchases from the website.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/50 uppercase border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4 font-semibold">Date</th>
                <th className="px-6 py-4 font-semibold">Student Details</th>
                <th className="px-6 py-4 font-semibold">Package & Payment</th>
                <th className="px-6 py-4 font-semibold">Academic Profile</th>
                <th className="px-6 py-4 font-semibold">Parent Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {purchases && purchases.length > 0 ? (
                purchases.map((purchase) => (
                  <tr key={purchase.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-slate-500 dark:text-slate-400">
                      {new Date(purchase.created_at).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                      <div className="text-xs mt-1">{new Date(purchase.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900 dark:text-white">{purchase.customer_name}</div>
                      <div className="text-slate-500 dark:text-slate-400">{purchase.email}</div>
                      <div className="text-slate-500 dark:text-slate-400">{purchase.phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 font-medium text-xs mb-2">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {purchase.plan_name}
                      </div>
                      <div className="font-bold text-slate-900 dark:text-white flex items-center">
                        <IndianRupee className="w-3.5 h-3.5 mr-0.5" />
                        {(purchase.amount / 100).toLocaleString('en-IN')}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1 truncate max-w-[150px]" title={purchase.payment_id}>
                        TXN: {purchase.payment_id}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                        <div><span className="text-slate-400">Score:</span> {purchase.neet_score}</div>
                        <div><span className="text-slate-400">Rank:</span> {purchase.rank}</div>
                        <div><span className="text-slate-400">Cat:</span> {purchase.category} {purchase.sub_category !== 'None' ? `(${purchase.sub_category})` : ''}</div>
                        <div className="col-span-2 mt-1 pt-1 border-t border-slate-100 dark:border-slate-800">
                          <span className="text-slate-400">Pref:</span> {purchase.college_pref} in {purchase.state_pref}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300 text-xs">
                      <div className="font-medium">{purchase.father_name}</div>
                      <div>{purchase.father_phone}</div>
                      <div>{purchase.father_email}</div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    No purchases found yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
