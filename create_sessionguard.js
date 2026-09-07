const fs = require('fs');
const path = 'D:/HelpVerse Projects/Portal HelpVerse/src/components/SessionGuard.tsx';

const content = `'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { logoutAction } from '@/app/actions/auth';
import { supabase } from '@/lib/supabase'; // or import an action

export default function SessionGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isRestricted, setIsRestricted] = useState(false);
  const idleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // 1. Tab Isolation Check
    // If not on login page, enforce tab session
    if (pathname && !pathname.startsWith('/login') && !pathname.startsWith('/forgot-password') && !pathname.startsWith('/reset-password')) {
      const hasTabSession = sessionStorage.getItem('hv_tab_session');
      if (!hasTabSession) {
        setIsRestricted(true);
        // Force redirect to login with a message, but don't delete the global cookie
        // so the original tab stays alive.
        router.push('/login?error=unauthorized_tab');
        return;
      }
    }

    // 2. Idle Tracking Setup
    const handleActivity = () => {
      lastActivityRef.current = Date.now();
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('touchstart', handleActivity);
    window.addEventListener('scroll', handleActivity);

    // 3. Periodic Idle Check (Every 1 minute)
    checkIntervalRef.current = setInterval(async () => {
      const now = Date.now();
      const idleTime = now - lastActivityRef.current;
      
      // 1 hour = 3600000 ms
      if (idleTime > 3600000) {
        // Check Attendance Status before logging out
        try {
          // We can call a direct server action, but to keep this clean without importing complex server actions here,
          // we can just fetch the current user's active attendance log for today using the client supabase instance
          // since RLS allows users to see their own logs.
          const today = new Date().toISOString().split('T')[0];
          
          // Get user id first
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data: log } = await supabase
              .from('attendance_logs')
              .select('check_in_time, check_out_time')
              .eq('employee_id', user.id)
              .eq('attendance_date', today)
              .single();

            // If there's an active check-in with NO check-out, they are working!
            if (log && log.check_in_time && !log.check_out_time) {
              // User is clocked in. Do NOT log them out.
              return;
            }
          } else {
             // We'll use a server action as fallback if standard auth session isn't loaded on supabase client
             const res = await fetch('/api/check-idle'); 
             // Actually, the simplest way is to create a small server action for this.
          }
          
        } catch (e) {
          console.error('Idle check failed', e);
        }
        
        // If we reach here, they are NOT clocked in, and have been idle for > 1hr
        await logoutAction();
        sessionStorage.removeItem('hv_tab_session');
        router.push('/login?error=session_expired_idle');
      }
    }, 60000);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
    };
  }, [pathname, router]);

  if (isRestricted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="text-center space-y-4">
          <div className="inline-flex p-4 rounded-full bg-red-500/20 text-red-500">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          </div>
          <h1 className="text-2xl font-bold">Unauthorized Tab Access</h1>
          <p className="text-slate-400 max-w-md">For security reasons, session sharing across duplicated tabs or copied URLs is restricted. Please log in again on this tab.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
`;

fs.writeFileSync(path, content);
console.log('Created SessionGuard.tsx');
