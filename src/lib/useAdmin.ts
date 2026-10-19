import { useCallback, useEffect, useState } from 'react';
import { supabase } from './supabase';
import { usePeopleStore } from './usePeopleStore';

// Admin mode (Me → Switch to admin). Who's an admin lives in app_admins and
// every admin action is checked by the database (is_admin() in RLS), so this
// only decides what the app shows.

export type AdminRole = 'owner' | 'admin';

const MODE_KEY = 'mo_admin_mode';

/** This account's admin role, or null (also while unknown, or before the migration). */
export function useAdminRole(): AdminRole | null {
  const { authUser } = usePeopleStore();
  const [role, setRole] = useState<AdminRole | null>(null);
  useEffect(() => {
    if (!authUser) {
      setRole(null);
      return;
    }
    let live = true;
    supabase
      .from('app_admins')
      .select('role')
      .eq('user_id', authUser.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (live) setRole(!error && data ? (data.role as AdminRole) : null);
      });
    return () => {
      live = false;
    };
  }, [authUser]);
  return role;
}

/** Whether admin mode is on, remembered on this phone so a reload stays in it. */
export function useAdminMode() {
  const [on, setOn] = useState(() => {
    try {
      return localStorage.getItem(MODE_KEY) === '1';
    } catch {
      return false;
    }
  });
  const set = useCallback((next: boolean) => {
    setOn(next);
    try {
      if (next) localStorage.setItem(MODE_KEY, '1');
      else localStorage.removeItem(MODE_KEY);
    } catch {
      // fine for this session
    }
  }, []);
  return [on, set] as const;
}
