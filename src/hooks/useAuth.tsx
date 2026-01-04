import { useState, useEffect, createContext, useContext, ReactNode, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean | null;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const currentCheckId = useRef<number>(0);

  // YOUR SPECIFIC ADMIN ID
  const MASTER_ADMIN_ID = "a54e2d01-fb17-4bd6-b678-bb2e446a5719";

  const checkAdminRole = async (userId: string) => {
    // 1. Immediate bypass if the ID matches yours perfectly
    if (userId === MASTER_ADMIN_ID) {
      console.log("Master ID detected, granting admin access.");
      setIsAdmin(true);
      return;
    }

    const checkId = ++currentCheckId.current;
    try {
      const { data, error } = await supabase.rpc('has_role', { 
        _user_id: userId, 
        _role: 'admin' 
      });

      if (checkId === currentCheckId.current) {
        if (error) throw error;
        setIsAdmin(data === true);
      }
    } catch (err) {
      console.error("Admin check failed:", err);
      if (checkId === currentCheckId.current) setIsAdmin(false);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      setLoading(true); // Keep loading true at start
      try {
        const { data: { session: s } } = await supabase.auth.getSession();
        setSession(s);
        setUser(s?.user ?? null);
        
        if (s?.user) {
          await checkAdminRole(s.user.id);
        } else {
          setIsAdmin(false);
        }
      } finally {
        setLoading(false); // Only set loading false AFTER role check
      }
    };
    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setLoading(true); // Re-enter loading state during role verification
        if (s?.user) await checkAdminRole(s.user.id);
        setLoading(false);
      } else if (event === 'SIGNED_OUT') {
        setIsAdmin(false);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true); // Start loading immediately on click
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setLoading(false);
        return { error };
      }
      if (data.user) {
        await checkAdminRole(data.user.id);
      }
      return { error: null };
    } catch (err: any) {
      setLoading(false);
      return { error: err };
    }
  };

  const signUp = async (email: string, password: string) => {
    return await supabase.auth.signUp({ email, password });
  };

  const signOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setIsAdmin(false);
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, isAdmin, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};