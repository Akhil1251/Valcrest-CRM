import { Loader2 } from 'lucide-react'

export default function Loading() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center w-full h-full min-h-[60vh] gap-4">
      <div className="relative">
        <div className="absolute inset-0 bg-indigo-500 rounded-full blur-xl opacity-20 animate-pulse"></div>
        <Loader2 className="w-10 h-10 text-indigo-600 dark:text-indigo-400 animate-spin relative z-10" />
      </div>
      <p className="text-sm font-bold text-slate-500 dark:text-slate-400 animate-pulse">
        Loading...
      </p>
    </div>
  )
}
