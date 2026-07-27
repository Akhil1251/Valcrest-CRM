import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { verifySetup } from './actions'
import { QrCode } from 'lucide-react'

export default async function MfaSetupPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>
}) {
  const { message } = await searchParams
  const supabase = await createClient()

  // Clean up any unverified factors first to avoid clutter
  const { data: factors } = await supabase.auth.mfa.listFactors()
  const unverified = factors?.totp?.filter(f => (f.status as string) === 'unverified') || []
  for (const factor of unverified) {
    await supabase.auth.mfa.unenroll({ factorId: factor.id })
  }

  // Create new MFA factor
  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: 'totp',
  })

  if (error) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center gap-4 mt-20 text-center text-slate-800 dark:text-slate-200">
        <p className="text-red-500 font-medium">Failed to generate MFA setup.</p>
        <p className="text-sm">{error.message}</p>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col w-full px-8 sm:max-w-md justify-center gap-2 mt-10 mx-auto">
      <div className="flex flex-col items-center justify-center mb-6 gap-2">
        <QrCode className="w-12 h-12 text-indigo-600 mb-2" />
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white text-center">
          Secure your account
        </h1>
        <p className="text-slate-500 text-sm text-center">
          Scan this QR code with your authenticator app (like Google Authenticator or Authy) to enable MFA.
        </p>
      </div>

      <div className="flex justify-center mb-6 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div dangerouslySetInnerHTML={{ __html: data.totp.qr_code }} className="w-48 h-48" />
      </div>

      <form
        className="flex-1 flex flex-col w-full justify-center gap-4 text-slate-800 dark:text-slate-200"
        action={verifySetup}
      >
        <input type="hidden" name="factorId" value={data.id} />
        
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-center" htmlFor="code">
            Enter the 6-digit code to verify
          </label>
          <input
            className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-center tracking-[0.5em] text-lg font-mono"
            name="code"
            placeholder="000000"
            required
            type="text"
            maxLength={6}
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="one-time-code"
          />
        </div>

        <button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-4 py-2.5 text-sm font-medium transition-colors shadow-sm mt-2">
          Verify & Enable
        </button>
        
        {message && (
          <p className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-center text-sm rounded-lg border border-red-100 dark:border-red-900/50">
            {message}
          </p>
        )}
      </form>
    </div>
  )
}
