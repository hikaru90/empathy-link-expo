import { authClient } from '@/lib/auth';
import { BETTER_AUTH_URL, EXPO_APP_URL } from '@/lib/config';
import { useRouter } from 'expo-router';
import { createContext, useContext, useEffect, useState } from 'react';

interface User {
  id: string;
  email: string;
  name?: string;
  emailVerified?: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ needsVerification: boolean }>;
  signUp: (email: string, password: string, name?: string) => Promise<{ needsVerification: boolean }>;
  signOut: () => Promise<void>;
  resendVerificationEmail: (email: string) => Promise<void>;
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
      console.log('Better Auth URL:', BETTER_AUTH_URL);
      console.log('Full test URL:', `${BETTER_AUTH_URL}/api/auth/get-session`);

      // First, test if backend is reachable with a simple fetch
      console.log('Testing backend connectivity...');
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

        const testResponse = await fetch(`${BETTER_AUTH_URL}/api/auth/get-session`, {
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
        setUser(null);
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
        
        if (typeof result.error === 'string') {
          errorMessage = result.error;
        } else if (result.error.message) {
          // Standard better-auth error format
          errorMessage = result.error.message;
          statusCode = result.error.status;
        } else if (result.error.error) {
          // Backend transformed error format nested in better-auth error
          if (typeof result.error.error === 'string') {
            errorMessage = result.error.error;
          } else {
            errorMessage = result.error.error.message || errorMessage;
            statusCode = result.error.error.status || result.error.status;
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
        
        // Check nested error structure first (backend transformed format)
        // Error structure: { error: { error: { message: "..." } } }
        if (result.error.error) {
          if (typeof result.error.error === 'string') {
            errorMessage = result.error.error;
          } else if (result.error.error.message) {
            // Nested error object: { error: { error: { message: "..." } } }
            errorMessage = result.error.error.message;
          }
        } 
        // Check direct message property
        else if (typeof result.error === 'string') {
          errorMessage = result.error;
        } else if (result.error.message) {
          // Standard better-auth error format
          errorMessage = result.error.message;
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

  const signOut = async () => {
    await authClient.signOut();
    setUser(null);
  };

  const resendVerificationEmail = async (email: string) => {
    // Use Expo app URL for the callback so users are redirected to the app, not the backend
    const callbackURL = `${EXPO_APP_URL}/verify-email-token`;
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
    signOut,
    resendVerificationEmail,
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