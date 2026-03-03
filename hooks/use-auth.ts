import { AuthContext, type AuthContextType } from '@/lib/auth-context';
import { authClient } from '@/lib/auth';
import { EXPO_APP_URL, getBetterAuthURL } from '@/lib/config';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';

export { AuthContext, useAuth } from '@/lib/auth-context';
import { useAuth } from '@/lib/auth-context';

type User = NonNullable<AuthContextType['user']>;

const isAndroidDev = __DEV__ && Platform.OS === 'android';

/**
 * Auth provider state and handlers with NO useEffect. Used on Android dev so no effect runs
 * (running any effect on first paint triggers endless rebundle). Session is not restored on load.
 */
export function useAuthProviderStateOnly(initialLoading: boolean = false): AuthContextType {
  if (__DEV__) console.log('[Auth] useAuthProviderStateOnly render (no effect), initialLoading=', initialLoading);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(initialLoading);

  const loadUser = async () => {
    if (__DEV__) console.log('[Auth] loadUser started (backend may be unreachable - we will not reload)');
    try {
      if (__DEV__) console.log('[Auth] step 1 - Platform:', Platform.OS, 'Better Auth URL:', getBetterAuthURL());

      // Debug: Check SecureStore for Better Auth session keys (static import - no dynamic import to avoid rebundle)
      if (Platform.OS !== 'web') {
        try {
          const sessionKey = 'empathy-link.session';
          const tokenKey = 'empathy-link.token';
          const storedSession = await SecureStore.getItemAsync(sessionKey);
          const storedToken = await SecureStore.getItemAsync(tokenKey);
          if (__DEV__) console.log('[Auth] step 2 - SecureStore session:', !!storedSession, 'token:', !!storedToken);
        } catch (secureStoreError) {
          if (__DEV__) console.warn('[Auth] step 2 - SecureStore check failed:', (secureStoreError as Error)?.message);
        }
      } else {
        if (__DEV__) console.log('[Auth] step 2 - skip SecureStore (web)');
      }

      if (__DEV__) console.log('[Auth] step 3 - calling authClient.getSession()...');
      let session: Awaited<ReturnType<typeof authClient.getSession>>;
      try {
        session = await authClient.getSession();
      } catch (getSessionError: unknown) {
        if (__DEV__) console.warn('[Auth] step 3 - getSession() threw (backend unreachable?):', (getSessionError as Error)?.message);
        setUser(null);
        return;
      }

      if (__DEV__) console.log('[Auth] step 4 - getSession result:', { hasData: !!session?.data, email: session?.data?.user?.email });

      if (session?.data?.user) {
        setUser(session.data.user as User);
        if (__DEV__) console.log('[Auth] step 5 - user set in context');
      } else {
        setUser(null);
        if (__DEV__) console.log('[Auth] step 5 - no user, cleared state');
      }
    } catch (error: unknown) {
      if (__DEV__) console.error('[Auth] loadUser caught (handling, no reload):', (error as Error)?.message ?? error);
      setUser(null);
    } finally {
      setIsLoading(false);
      if (__DEV__) console.log('[Auth] loadUser finished, isLoading=false');
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      let result;
      try {
        if (__DEV__) {
          console.log('Calling authClient.signIn.email...');
        }
        result = await authClient.signIn.email({
          email,
          password,
        });
        if (__DEV__) {
          console.log('authClient.signIn.email completed, result:', result);
          console.log('Result type:', typeof result);
          console.log('Result keys:', result ? Object.keys(result) : 'null');
          console.log('Has error property:', result ? 'error' in result : false);
          console.log('Error value:', result?.error);
        }
      } catch (fetchError: any) {
        // Better-auth might throw an exception for HTTP errors (like 403)
        // Try to extract error info from the exception
        if (__DEV__) {
          console.log('signIn fetchError (exception):', fetchError);
          console.log('fetchError details:', {
            message: fetchError?.message,
            status: fetchError?.status,
            statusText: fetchError?.statusText,
            error: fetchError?.error,
            response: fetchError?.response,
          });
        }
        
        // Check various error formats that better-auth might use
        let errorMessage = 'Anmeldung fehlgeschlagen';
        let statusCode: number | undefined;
        
        if (fetchError?.message) {
          errorMessage = fetchError.message;
        }
        if (fetchError?.status) {
          statusCode = fetchError.status;
        }
        // Check nested error structures
        if (fetchError?.error) {
          if (typeof fetchError.error === 'string') {
            errorMessage = fetchError.error;
          } else if (fetchError.error.message) {
            errorMessage = fetchError.error.message;
            statusCode = fetchError.error.status || statusCode;
          }
        }
        // Check response body if available
        if (fetchError?.response) {
          try {
            const responseData = await fetchError.response.json?.() || fetchError.response;
            if (responseData?.error?.message) {
              errorMessage = responseData.error.message;
              statusCode = responseData.error.status || statusCode;
            }
          } catch (e) {
            // Ignore JSON parse errors
          }
        }
        
        // Convert to result format so it can be handled by the existing error handling
        result = {
          error: {
            message: errorMessage,
            status: statusCode || 500,
            statusText: fetchError.statusText || 'Error',
          },
          data: null,
        };
      }

      // Check if result exists and has an error
      if (!result) {
        if (__DEV__) {
          console.log('signIn: result is null/undefined');
        }
        throw new Error('Keine Antwort vom Server erhalten');
      }

      if (__DEV__) {
        console.log('signIn result after try-catch:', { 
          hasError: !!result.error, 
          error: result.error, 
          hasData: !!result.data,
          resultKeys: Object.keys(result || {}),
          fullResult: JSON.stringify(result, null, 2)
        });
      }

      // Check for error in result - better-auth returns errors in result.error
      if (result.error) {
        if (__DEV__) {
          console.log('signIn: result has error, processing...', result.error);
        }
        // Better-auth error format: { message: string, status: number, statusText: string }
        // Backend transforms errors to { error: "message" } but better-auth wraps it
        // See: https://www.better-auth.com/docs/concepts/client
        let errorMessage = 'Anmeldung fehlgeschlagen';
        let statusCode: number | undefined;
        
        const errorObj = result.error as any;
        if (typeof errorObj === 'string') {
          errorMessage = errorObj;
        } else if (errorObj.message) {
          // Standard better-auth error format
          errorMessage = errorObj.message;
          statusCode = errorObj.status;
        } else if (errorObj.error) {
          // Backend transformed error format nested in better-auth error
          if (typeof errorObj.error === 'string') {
            errorMessage = errorObj.error;
          } else {
            errorMessage = errorObj.error.message || errorMessage;
            statusCode = errorObj.error.status || errorObj.status;
          }
        }
        
        if (__DEV__) {
          console.log('signIn error extracted:', { errorMessage, statusCode, fullError: result.error });
        }
        
        // Preserve status code in error object
        const error = new Error(errorMessage) as any;
        if (statusCode) {
          error.status = statusCode;
        }
        throw error;
      }

      const user = result.data?.user as User | undefined;
      const needsVerification = user && !user.emailVerified;

      if (user) {
        setUser(user);
      }

      return { needsVerification: !!needsVerification };
    } catch (error: any) {
      // Better-auth may throw exceptions for HTTP errors like 422, 403
      // Error format: { message: string, status: number, statusText: string }
      // Or nested: { error: { message: string, status: number, statusText: string } }
      // Example: { message: "Diese E-Mail-Adresse ist bereits registriert...", status: 422, statusText: "Unprocessable Entity" }
      let errorMessage = 'Anmeldung fehlgeschlagen';
      let statusCode: number | undefined;
      
      // If error is already an Error instance with a message, use it
      if (error instanceof Error && error.message) {
        errorMessage = error.message;
        statusCode = (error as any).status;
      } 
      // If error is the better-auth error object with message property
      else if (error?.message && typeof error.message === 'string') {
        errorMessage = error.message;
        statusCode = error.status;
      } 
      // Check for nested error structures (better-auth format: { error: { message, status } })
      else if (error?.error) {
        if (typeof error.error === 'string') {
          errorMessage = error.error;
        } else if (error.error.message) {
          errorMessage = error.error.message;
          statusCode = error.error.status || statusCode;
        } else if (error.error.error) {
          errorMessage = typeof error.error.error === 'string' 
            ? error.error.error 
            : error.error.error.message || errorMessage;
          statusCode = error.error.error.status || error.error.status || statusCode;
        }
      } 
      // Fallback to string conversion
      else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      // Preserve status code in error object
      const finalError = new Error(errorMessage) as any;
      if (statusCode) {
        finalError.status = statusCode;
      }
      
      if (__DEV__) {
        console.log('signIn error details:', { errorMessage, statusCode, originalError: error });
      }
      
      throw finalError;
    }
  };

  const signUp = async (email: string, password: string, name?: string) => {
    try {
      const signUpData = {
        email,
        password,
        ...(name ? { name } : {}),
      };
      
      // Debug: Log what we're sending (remove in production)
      if (__DEV__) {
        console.log('SignUp attempt - Email:', email, 'Password length:', password.length, 'Name:', name);
      }
      
      const result = await authClient.signUp.email(signUpData as any);

      if (result.error) {
        // Better-auth error format can be nested:
        // { error: { error: { message: "...", status: 422 } }, status: 422 }
        // Log full error for debugging
        if (__DEV__) {
          console.error('SignUp error from better-auth:', JSON.stringify(result.error, null, 2));
        }
        
        let errorMessage = 'Registrierung fehlgeschlagen';
        
        const errorObj = result.error as any;
        
        // Check nested error structure first (backend transformed format)
        // Error structure: { error: { error: { message: "..." } } }
        if (errorObj.error) {
          if (typeof errorObj.error === 'string') {
            errorMessage = errorObj.error;
          } else if (errorObj.error.message) {
            // Nested error object: { error: { error: { message: "..." } } }
            errorMessage = errorObj.error.message;
          }
        } 
        // Check direct message property
        else if (typeof errorObj === 'string') {
          errorMessage = errorObj;
        } else if (errorObj.message) {
          // Standard better-auth error format
          errorMessage = errorObj.message;
        }
        
        if (__DEV__) {
          console.log('Extracted error message:', errorMessage);
        }
        
        throw new Error(errorMessage);
      }

      const user = result.data?.user as User | undefined;
      // New signups always need email verification
      const needsVerification = true;

      if (user) {
        setUser(user);
      }

      return { needsVerification };
    } catch (error: any) {
      // Better-auth may throw exceptions for HTTP errors like 422
      // Error format: { message: string, status: number, statusText: string }
      // Example: { message: "Diese E-Mail-Adresse ist bereits registriert...", status: 422, statusText: "Unprocessable Entity" }
      let errorMessage = 'Registrierung fehlgeschlagen';
      
      // If error is already an Error instance with a message, use it
      if (error instanceof Error && error.message) {
        errorMessage = error.message;
      } 
      // If error is the better-auth error object with message property
      else if (error?.message && typeof error.message === 'string') {
        errorMessage = error.message;
      } 
      // Check for nested error structures
      else if (error?.error) {
        if (typeof error.error === 'string') {
          errorMessage = error.error;
        } else if (error.error.message) {
          errorMessage = error.error.message;
        } else if (error.error.error) {
          errorMessage = typeof error.error.error === 'string' 
            ? error.error.error 
            : error.error.error.message || errorMessage;
        }
      } 
      // Fallback to string conversion
      else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      throw new Error(errorMessage);
    }
  };

  const signInWithSocial = async (provider: 'google' | 'apple') => {
    // On native, use Linking.createURL so Expo Go gets exp://... and dev builds get empathy-link://
    const callbackURL =
      Platform.OS === 'web'
        ? `${EXPO_APP_URL}/`
        : Linking.createURL('/');
    const result = await authClient.signIn.social({
      provider,
      callbackURL,
    });
    if (result?.error) {
      throw new Error(result.error.message || `Anmeldung mit ${provider} fehlgeschlagen`);
    }
    await loadUser();
  };

  const signOut = async () => {
    await authClient.signOut();
    setUser(null);
  };

  const resendVerificationEmail = async (email: string) => {
    const callbackURL =
      Platform.OS === 'web'
        ? `${EXPO_APP_URL}/verify-email-token`
        : Linking.createURL('/verify-email-token');
    const { data, error } = await authClient.sendVerificationEmail({
      email,
      callbackURL,
    });

    if (error) {
      let errorMessage = 'Fehler beim Senden der Bestätigungs-E-Mail';
      
      if (error.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      throw new Error(errorMessage);
    }
  };

  return {
    user,
    isLoading,
    signIn,
    signUp,
    signInWithSocial,
    signOut,
    resendVerificationEmail,
    refresh: loadUser,
  };
}

/** Full auth provider with loadUser effect. Do not use on Android dev (use useAuthProviderStateOnly in layout instead). */
export function useAuthProvider(): AuthContextType {
  const auth = useAuthProviderStateOnly(!isAndroidDev);
  useEffect(() => {
    if (__DEV__) console.log('[Auth] useAuthProvider effect RUN (isAndroidDev=%s)', isAndroidDev);
    if (isAndroidDev) return;
    if (__DEV__) console.log('[Auth] useAuthProvider effect calling refresh()');
    auth.refresh();
  }, []);
  return auth;
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