/**
 * Auth provider for Android dev only. Does NOT import hooks/use-auth so that
 * root layout can avoid loading use-auth and stop endless rebundle.
 * Uses authClient directly; no session restore on load.
 */
import { AuthContext, type AuthContextType } from '@/lib/auth-context';
import { authClient, clearBearerToken } from '@/lib/auth';
import { EXPO_APP_URL, getBetterAuthURL } from '@/lib/config';
import * as Linking from 'expo-linking';
import React, { useState } from 'react';
import { Platform } from 'react-native';

type User = NonNullable<AuthContextType['user']>;

const noop = async () => {};

export function AndroidDevAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const signIn: AuthContextType['signIn'] = async (email, password) => {
    const result = await authClient.signIn.email({ email, password });
    if (result?.error) {
      const msg = typeof result.error === 'string' ? result.error : (result.error as { message?: string }).message ?? 'Anmeldung fehlgeschlagen';
      throw new Error(msg);
    }
    const u = result?.data?.user as User | undefined;
    if (u) setUser(u);
    return { needsVerification: !!(u && !u.emailVerified) };
  };

  const signUp: AuthContextType['signUp'] = async (email, password, name) => {
    const result = await authClient.signUp.email({ email, password, ...(name ? { name } : {}) } as never);
    if (result?.error) {
      const msg = typeof result.error === 'string' ? result.error : (result.error as { message?: string }).message ?? 'Registrierung fehlgeschlagen';
      throw new Error(msg);
    }
    const u = result?.data?.user as User | undefined;
    if (u) setUser(u);
    return { needsVerification: true };
  };

  const signOut: AuthContextType['signOut'] = async () => {
    await authClient.signOut();
    clearBearerToken();
    setUser(null);
  };

  const signInWithSocial: AuthContextType['signInWithSocial'] = async (provider) => {
    const callbackURL = Platform.OS === 'web' ? `${EXPO_APP_URL}/login` : Linking.createURL('/login');
    console.log('[auth] social sign-in start (android-dev)', {
      provider,
      betterAuthBaseURL: getBetterAuthURL(),
      callbackURL,
    });
    const result = await authClient.signIn.social({ provider, callbackURL });
    if (result?.error) throw new Error(result.error.message || `Anmeldung mit ${provider} fehlgeschlagen`);
    const session = await authClient.getSession();
    if (session?.data?.user) setUser(session.data.user as User);
  };

  const resendVerificationEmail: AuthContextType['resendVerificationEmail'] = async (email) => {
    const callbackURL = Platform.OS === 'web' ? `${EXPO_APP_URL}/verify-email-token` : Linking.createURL('/verify-email-token');
    const { error } = await authClient.sendVerificationEmail({ email, callbackURL });
    if (error) throw new Error(error.message || 'Fehler beim Senden');
  };

  const refresh = async () => {
    try {
      const session = await authClient.getSession();
      setUser(session?.data?.user ? (session.data.user as User) : null);
    } catch {
      setUser(null);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading: false,
    signIn,
    signUp,
    signInWithSocial,
    signOut,
    resendVerificationEmail,
    refresh,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
