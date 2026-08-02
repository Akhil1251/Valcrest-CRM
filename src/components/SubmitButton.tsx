'use client'

import { useFormStatus } from 'react-dom'
import { Loader2 } from 'lucide-react'

export default function SubmitButton({
  children,
  loadingText = 'Please wait...',
  className = '',
}: {
  children: React.ReactNode
  loadingText?: string
  className?: string
}) {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className={`bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-4 py-2.5 text-sm font-medium transition-colors shadow-sm mt-2 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed ${className}`}
    >
      {pending && <Loader2 className="w-4 h-4 animate-spin" />}
      {pending ? loadingText : children}
    </button>
  )
}
