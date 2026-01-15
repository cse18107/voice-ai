"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService, AuthUser } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  interviewCount: number;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshCount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [interviewCount, setInterviewCount] = useState(0);
  const router = useRouter();

  const refreshCount = async () => {
    if (!user) return;
    const { count } = await supabase
      .from('interviews')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);
    setInterviewCount(count || 0);
  };

  useEffect(() => {
    const initializeAuth = async () => {
      const session = await authService.getSession();
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();
        
        const u = {
          ...session.user,
          role: profile?.role || 'guest'
        } as AuthUser;
        setUser(u);

        // Fetch count
        const { count } = await supabase
          .from('interviews')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', u.id);
        setInterviewCount(count || 0);
      }
      setLoading(false);
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = authService.onAuthStateChange(async (u) => {
      if (u) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', u.id)
          .single();
        
        const loggedInUser = {
          ...u,
          role: profile?.role || 'guest'
        } as AuthUser;
        setUser(loggedInUser);

        const { count } = await supabase
          .from('interviews')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', u.id);
        setInterviewCount(count || 0);
      } else {
        setUser(null);
        setInterviewCount(0);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    await authService.signIn(email, password);
    // User role and count will be handled by the onAuthStateChange listener
    router.push('/dashboard');
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    await authService.signUp(email, password, fullName);
    router.push('/dashboard');
  };

  const signOut = async () => {
    await authService.signOut();
    setUser(null);
    setInterviewCount(0);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, interviewCount, signIn, signUp, signOut, refreshCount }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
