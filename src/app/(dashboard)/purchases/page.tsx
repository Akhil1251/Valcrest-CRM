import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { CheckCircle2, IndianRupee, XCircle, Clock, RefreshCw } from 'lucide-react'
import Link from 'next/link'

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

  const { data: purchases, error } = await supabase
    .from('purchases')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Purchases</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">View all package purchases from the website.</p>
        </div>
        <Link href="/purchases" className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg text-sm font-medium transition-colors">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Link>
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
                        day: '2-digit', month: 'short', year: 'numeric'
                      })}
                      <div className="text-xs mt-1">{new Date(purchase.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900 dark:text-white">{purchase.customer_name}</div>
                      <div className="text-slate-500 dark:text-slate-400">{purchase.email}</div>
                      <div className="text-slate-500 dark:text-slate-400">{purchase.phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2 mb-2">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-medium text-xs">
                          {purchase.plan_name}
                        </div>
                        {purchase.status === 'Successful' || purchase.status === 'success' ? (
                            <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-wider">
                                <CheckCircle2 className="w-3 h-3" /> SUCCESS
                            </div>
                        ) : purchase.status === 'Pending' ? (
                            <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold uppercase tracking-wider">
                                <Clock className="w-3 h-3" /> PENDING
                            </div>
                        ) : (
                            <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-50 text-red-700 text-[10px] font-bold uppercase tracking-wider">
                                <XCircle className="w-3 h-3" /> FAILED
                            </div>
                        )}
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
