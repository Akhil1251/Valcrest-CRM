'use client'

import { MessageSquare, RefreshCcw } from 'lucide-react'
import { updateInquiryStatus } from './actions'

export default function InquiriesClient({ inquiries }: { inquiries: any[] }) {
  
  async function handleRefresh() {
    window.location.reload()
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-indigo-600" />
            Website Inquiries
          </h1>
          <p className="text-slate-500 mt-1">Manage leads coming directly from the Valcrest website.</p>
        </div>
        <button 
          onClick={handleRefresh}
          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
        >
          <RefreshCcw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {inquiries.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden min-h-[400px] flex items-center justify-center">
          <div className="text-center p-6 max-w-sm">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 dark:text-white">No inquiries yet</h3>
            <p className="text-slate-500 text-sm mt-2">
              When potential clients contact you via the website, they will appear here for assignment.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Message / Source</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {inquiries.map((inquiry) => (
                  <tr key={inquiry.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/25 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white align-top">
                      {inquiry.name}
                    </td>
                    <td className="px-6 py-4 text-slate-500 align-top">
                      <div>{inquiry.email}</div>
                      <div className="text-xs mt-1">{inquiry.phone || 'No phone'}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300 align-top max-w-xs whitespace-pre-wrap">
                      {inquiry.message}
                    </td>
                    <td className="px-6 py-4 align-top">
                      <select 
                        defaultValue={inquiry.status}
                        onChange={(e) => updateInquiryStatus(inquiry.id, e.target.value)}
                        className={`bg-transparent border rounded-md py-1 px-2 text-xs font-medium ${
                          inquiry.status === 'Pending' ? 'border-orange-200 text-orange-700 bg-orange-50' :
                          inquiry.status === 'Assigned' ? 'border-blue-200 text-blue-700 bg-blue-50' :
                          'border-emerald-200 text-emerald-700 bg-emerald-50'
                        }`}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Assigned">Assigned</option>
                        <option value="Resolved">Resolved</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-slate-500 align-top">
                      {new Date(inquiry.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
