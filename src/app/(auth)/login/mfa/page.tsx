import { ShieldCheck } from 'lucide-react'
import { verifyMfa } from './actions'

export default async function MfaPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>
}) {
  const { message } = await searchParams

  return (
    <div className="flex-1 flex flex-col w-full px-8 sm:max-w-md justify-center gap-2 mt-20 mx-auto">
      <div className="flex flex-col items-center justify-center mb-8 gap-4">
        <ShieldCheck className="w-16 h-16 text-indigo-600" />
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white text-center">
          Two-Factor Authentication
        </h1>
        <p className="text-slate-500 text-sm text-center">
          Please enter the authentication code provided by your authenticator app.
        </p>
      </div>

      <form
        className="flex-1 flex flex-col w-full justify-center gap-4 text-slate-800 dark:text-slate-200"
        action={verifyMfa}
      >
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium" htmlFor="code">
            Authentication Code
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
          Verify Code
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
