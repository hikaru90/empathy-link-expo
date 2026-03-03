import { createContext, useContext } from 'react';

/** Shared auth context and consumer. No provider logic here so layout can use this without loading hooks/use-auth. */
export interface AuthContextType {
  user: { id: string; email: string; name?: string; emailVerified?: boolean } | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ needsVerification: boolean }>;
  signUp: (email: string, password: string, name?: string) => Promise<{ needsVerification: boolean }>;
  signInWithSocial: (provider: 'google' | 'apple') => Promise<void>;
  signOut: () => Promise<void>;
  resendVerificationEmail: (email: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
