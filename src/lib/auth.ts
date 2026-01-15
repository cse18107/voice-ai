import { supabase } from './supabase';

export interface AuthUser {
  id: string;
  email: string;
  role?: 'admin' | 'guest';
  user_metadata?: {
    full_name?: string;
  };
}

export const authService = {
  async signUp(email: string, password: string, fullName: string) {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) throw error;
    return data;
  },

  async signIn(email: string, password: string) {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  },

  async signOut() {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getCurrentUser(): Promise<AuthUser | null> {
    if (!supabase) {
      return null;
    }

    const { data: { user } } = await supabase.auth.getUser();
    return user as AuthUser | null;
  },

  async getSession() {
    if (!supabase) {
      return null;
    }

    const { data: { session } } = await supabase.auth.getSession();
    return session;
  },

  onAuthStateChange(callback: (user: AuthUser | null) => void) {
    if (!supabase) {
      return { data: { subscription: { unsubscribe: () => {} } } };
    }

    return supabase.auth.onAuthStateChange((_event, session) => {
      callback(session?.user as AuthUser | null);
    });
  },
};
