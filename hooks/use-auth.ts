import { authClient } from '@/lib/auth';
import { API_BASE_URL } from '@/lib/config';
import { useRouter } from 'expo-router';
import { createContext, useContext, useEffect, useState } from 'react';

interface User {
  id: string;
  email: string;
  name?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name?: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

export function useAuthProvider(): AuthContextType {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      console.log('=== Loading user session ===');
      console.log('Backend URL:', API_BASE_URL);
      console.log('Full test URL:', `${API_BASE_URL}/api/auth/get-session`);

      // First, test if backend is reachable with a simple fetch
      console.log('Testing backend connectivity...');
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

        const testResponse = await fetch(`${API_BASE_URL}/api/auth/get-session`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        console.log('✅ Backend test response status:', testResponse.status);
        const testData = await testResponse.text();
        console.log('Backend response:', testData);
      } catch (testError: any) {
        console.error('❌ Backend not reachable:', testError?.message);
        console.error('Error name:', testError?.name);
        throw new Error(`Cannot connect to backend server: ${testError?.message}`);
      }

      console.log('Calling authClient.getSession()...');
      const session = await authClient.getSession();
      console.log('Session loaded:', session);
      if (session?.data?.user) {
        setUser(session.data.user as User);
      } else {
        console.log('No user in session');
      }
    } catch (error: any) {
      console.error('Error loading user:', error);
      console.error('Error message:', error?.message);
      // Don't throw - just log and continue
      // This allows the app to work even if the backend is unreachable
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    const result = await authClient.signIn.email({
      email,
      password,
    });

    if (result.error) {
      throw new Error(result.error.message || 'Anmeldung fehlgeschlagen');
    }

    if (result.data?.user) {
      setUser(result.data.user as User);
    }
  };

  const signUp = async (email: string, password: string, name?: string) => {
    const result = await authClient.signUp.email({
      email,
      password,
      name,
    });

    if (result.error) {
      throw new Error(result.error.message || 'Registrierung fehlgeschlagen');
    }

    if (result.data?.user) {
      setUser(result.data.user as User);
    }
  };

  const signOut = async () => {
    await authClient.signOut();
    setUser(null);
  };

  return {
    user,
    isLoading,
    signIn,
    signUp,
    signOut,
  };
}

export function useAuthGuard(redirectTo: string = '/(auth)/login') {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace(redirectTo as any);
    }
  }, [user, isLoading, redirectTo, router]);

  return {
    isAuthenticated: !!user,
    isLoading,
    user,
  };
}