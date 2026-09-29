import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { apiRequest, configureApiAuth } from '@/api/client';

import { tokenStorage } from './tokenStorage';
import type { FacilityContext, MeResponse, Permission, Session } from './types';

type Status = 'loading' | 'signedOut' | 'signedIn';

type AuthValue = {
  status: Status;
  session: Session | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  /** Re-reads /api/me, for example after the facility currency or profile changes. */
  refreshSession: () => Promise<void>;
  updateFacilityContext: (patch: Partial<FacilityContext>) => void;
};

const AuthContext = createContext<AuthValue | null>(null);

function toSession(me: MeResponse): Session {
  return {
    user: {
      id: me.user.id,
      firstName: me.user.firstName,
      lastName: me.user.lastName,
      email: me.user.email,
      phone: me.user.phone,
      role: me.user.role,
    },
    facility: { id: me.facility.id, name: me.facility.name, timezone: me.facility.timezone, currency: me.facility.currency },
    permissions: me.permissions,
  };
}

type SessionProviderProps = {
  children: ReactNode;
  /** Tests and previews can start signed in without touching storage or the network. */
  initialSession?: Session;
};

export function SessionProvider({ children, initialSession }: SessionProviderProps) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<Status>(initialSession ? 'signedIn' : 'loading');
  const [session, setSession] = useState<Session | null>(initialSession ?? null);
  const tokenRef = useRef<string | null>(null);

  const clearLocal = useCallback(async () => {
    tokenRef.current = null;
    await tokenStorage.clear();
    queryClient.clear();
    setSession(null);
    setStatus('signedOut');
  }, [queryClient]);

  useEffect(() => {
    configureApiAuth({
      getAccessToken: () => tokenRef.current,
      onUnauthorized: () => {
        void clearLocal();
      },
    });
  }, [clearLocal]);

  useEffect(() => {
    if (initialSession) return;
    let cancelled = false;
    (async () => {
      const token = await tokenStorage.get();
      if (!token) {
        if (!cancelled) setStatus('signedOut');
        return;
      }
      tokenRef.current = token;
      try {
        const me = await apiRequest<MeResponse>('/api/me');
        if (!cancelled) {
          setSession(toSession(me));
          setStatus('signedIn');
        }
      } catch {
        if (!cancelled) await clearLocal();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [initialSession, clearLocal]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { accessToken } = await apiRequest<{ accessToken: string }>('/api/auth/sign-in', {
      method: 'POST',
      body: { email: email.trim(), password },
    });
    tokenRef.current = accessToken;
    await tokenStorage.set(accessToken);
    const me = await apiRequest<MeResponse>('/api/me');
    setSession(toSession(me));
    setStatus('signedIn');
  }, []);

  const signOut = useCallback(async () => {
    try {
      await apiRequest('/api/auth/sign-out', { method: 'POST' });
    } catch {
      // Signing out locally must always succeed, even offline.
    }
    await clearLocal();
  }, [clearLocal]);

  const refreshSession = useCallback(async () => {
    const me = await apiRequest<MeResponse>('/api/me');
    setSession(toSession(me));
  }, []);

  const updateFacilityContext = useCallback((patch: Partial<FacilityContext>) => {
    setSession((s) => (s ? { ...s, facility: { ...s.facility, ...patch } } : s));
  }, []);

  const value = useMemo(
    () => ({ status, session, signIn, signOut, refreshSession, updateFacilityContext }),
    [status, session, signIn, signOut, refreshSession, updateFacilityContext],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside <SessionProvider>');
  return value;
}

/** For signed-in screens only. */
export function useSession() {
  const { session } = useAuth();
  const granted = session?.permissions;
  const permissions = useMemo(() => new Set(granted ?? []), [granted]);
  const can = useCallback((permission: Permission) => permissions.has(permission), [permissions]);
  if (!session) throw new Error('useSession used while signed out');
  return { session, can };
}
