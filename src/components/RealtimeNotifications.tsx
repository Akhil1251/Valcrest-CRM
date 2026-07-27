'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { MessageSquare, X } from 'lucide-react'

// A short, pleasant notification "ding" in base64 format so we don't need an external file
const NOTIFICATION_SOUND = 'data:audio/mp3;base64,//NExAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//NExAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq'

export default function RealtimeNotifications() {
  const [perm, setPerm] = useState<string>('default')
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const router = useRouter()
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const originalTitle = useRef(typeof document !== 'undefined' ? document.title : 'Valcrest CRM')

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPerm(Notification.permission)
    }
    
    // Setup audio
    if (typeof window !== 'undefined' && !audioRef.current) {
      const audio = new Audio('https://cdn.freesound.org/previews/413/413203_2224746-lq.mp3') // Simple ding
      audio.volume = 0.5
      audioRef.current = audio
    }

    const supabase = createClient()
    let lastCount = -1
    let titleInterval: NodeJS.Timeout

    const showInAppToast = (message: string) => {
      setToastMessage(message)
      setTimeout(() => setToastMessage(null), 5000)
    }

    const triggerUltimateAlert = (message: string) => {
      // 1. Play Sound (works even when minimized!)
      if (audioRef.current) {
        audioRef.current.play().catch(e => console.log('Audio autoplay blocked', e))
      }
      
      // 2. Flash Tab Title
      let isFlashing = false
      let flashCount = 0
      clearInterval(titleInterval)
      titleInterval = setInterval(() => {
        document.title = isFlashing ? '(1) New Lead!' : originalTitle.current
        isFlashing = !isFlashing
        flashCount++
        if (flashCount > 10) { // Stop flashing after a few seconds
          clearInterval(titleInterval)
          document.title = originalTitle.current
        }
      }, 1000)
      
      // 3. Show In-App Toast
      showInAppToast(message)
      
      // 4. Try OS Notification (if it works)
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        new Notification('New CRM Inquiry!', {
          body: message,
          icon: '/favicon.ico'
        })
      }
    }

    // 1. Foolproof Polling Fallback
    const checkNewInquiries = async () => {
      const { count } = await supabase
        .from('inquiries')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Pending')

      const currentCount = count || 0
      
      if (lastCount !== -1 && currentCount > lastCount) {
        console.log('Polling detected new inquiry!')
        router.refresh()
        triggerUltimateAlert('You received a new website inquiry!')
      }
      lastCount = currentCount
    }

    checkNewInquiries()
    const interval = setInterval(checkNewInquiries, 5000)

    // 2. Supabase Realtime (Instant)
    const channel = supabase.channel('global_notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'inquiries' },
        (payload) => {
          console.log('Realtime Event Received:', payload)
          router.refresh()
          const newInquiry = payload.new as any
          triggerUltimateAlert(`You received a new inquiry from ${newInquiry.name}`)
        }
      )
      .subscribe()

    return () => {
      clearInterval(interval)
      clearInterval(titleInterval)
      supabase.removeChannel(channel)
      document.title = originalTitle.current
    }
  }, [router])

  const requestPermission = () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      Notification.requestPermission().then(permission => {
        setPerm(permission)
        if (permission === 'granted') {
          new Notification('Notifications Enabled!', {
            body: 'You will now receive pop-ups for new inquiries.',
            icon: '/favicon.ico'
          })
        }
      })
    }
  }

  return (
    <>
      {/* In-App Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 bg-white dark:bg-slate-900 border-l-4 border-indigo-500 shadow-2xl rounded-lg p-4 z-[100] flex items-start gap-4 min-w-[300px] animate-in slide-in-from-right-8 fade-in">
          <div className="bg-indigo-100 dark:bg-indigo-900/50 p-2 rounded-full">
            <MessageSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="flex-1 pt-0.5">
            <p className="text-sm font-bold text-slate-900 dark:text-white">New CRM Inquiry!</p>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{toastMessage}</p>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Permission Prompt */}
      {(perm === 'default' || perm === 'denied') && (
        <div className="fixed bottom-4 right-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-lg p-4 z-50 animate-in slide-in-from-bottom-5">
          <p className="text-sm font-medium text-slate-800 dark:text-slate-200 mb-3">
            Enable desktop pop-ups for new leads?
          </p>
          <button 
            onClick={requestPermission}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-1.5 rounded transition-colors w-full"
          >
            Enable OS Notifications
          </button>
        </div>
      )}
    </>
  )
}
