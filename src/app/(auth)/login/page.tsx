import Link from 'next/link'
import Image from 'next/image'
import { login } from './actions'
import { Shield } from 'lucide-react'
import SubmitButton from '@/components/SubmitButton'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>
}) {
  const { message } = await searchParams

  return (
    <div className="flex-1 flex flex-col w-full px-8 sm:max-w-md justify-center gap-2 mt-20 mx-auto">
      <div className="flex flex-col items-center justify-center mb-8 gap-4">
        <Image src="/logo.png" alt="Valcrest Logo" width={200} height={200} className="object-contain" />
        <p className="text-slate-500 text-sm">Sign in to your secure portal</p>
      </div>

      <form
        className="flex-1 flex flex-col w-full justify-center gap-4 text-slate-800 dark:text-slate-200"
        action={login}
      >
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium" htmlFor="email">
            Email address
          </label>
          <input
            className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            name="email"
            placeholder="admin@valcrest.com"
            required
            type="email"
          />
        </div>
        
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium" htmlFor="password">
            Password
          </label>
          <input
            className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            type="password"
            name="password"
            placeholder="••••••••"
            required
          />
        </div>

        <SubmitButton loadingText="Signing In...">
          Sign In
        </SubmitButton>
        
        {message && (
          <p className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-center text-sm rounded-lg border border-red-100 dark:border-red-900/50">
            {message}
          </p>
        )}
      </form>
    </div>
  )
}
