import baseColors from '@/baseColors.config';
import { authClient } from '@/lib/auth';
import { BETTER_AUTH_URL } from '@/lib/config';
import { Link, Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '@/hooks/use-auth';

export default function VerifyEmailTokenScreen() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams<{ token?: string; callbackURL?: string }>();
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    // Auto-verify when component mounts if we have a token
    if (params.token && !isVerifying && verificationStatus === 'idle') {
      handleVerifyEmail();
    }
  }, [params.token]);

  const handleVerifyEmail = async () => {
    if (!params.token) {
      setErrorMessage('Kein Verifizierungstoken gefunden');
      setVerificationStatus('error');
      return;
    }

    setIsVerifying(true);
    setVerificationStatus('idle');
    setErrorMessage(null);

    try {
      console.log('Verifying email with token:', params.token?.substring(0, 20) + '...');
      console.log('Better Auth URL:', BETTER_AUTH_URL);
      
      // Better Auth's verify-email endpoint typically uses GET with token as query parameter
      const verifyUrl = `${BETTER_AUTH_URL}/api/auth/verify-email?token=${encodeURIComponent(params.token)}`;
      console.log('Verification URL:', verifyUrl);
      
      let response = await fetch(verifyUrl, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
        },
      });

      // If GET returns 405 (Method Not Allowed), try POST
      if (response.status === 405) {
        console.log('GET returned 405, trying POST instead...');
        response = await fetch(`${BETTER_AUTH_URL}/api/auth/verify-email`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({ token: params.token }),
        });
      }

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      // Handle response - might be JSON or empty (redirect)
      // Read response as text first, then try to parse as JSON
      const responseText = await response.text();
      console.log('Response text:', responseText);
      console.log('Response status:', response.status);
      
      let data: any = {};
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        // Try to parse as JSON
        try {
          data = JSON.parse(responseText);
          console.log('Response data (JSON):', data);
        } catch {
          // If parsing fails, treat as error
          data = { error: responseText || 'Invalid JSON response' };
        }
      } else {
        // Not JSON content type
        if (response.ok) {
          // Success - might be empty response or HTML redirect
          // If empty, assume success
          if (responseText.trim() === '') {
            data = { success: true };
          } else {
            // Try to parse as JSON even if content-type says otherwise
            try {
              data = JSON.parse(responseText);
            } catch {
              // If it's not JSON and response is OK, assume success
              data = { success: true };
            }
          }
        } else {
          // Error response - try to parse as JSON, otherwise use text
          try {
            data = JSON.parse(responseText);
          } catch {
            data = { error: responseText || 'Verification failed' };
          }
        }
      }

      if (!response.ok || data.error) {
        let errorMessage = 'E-Mail-Verifizierung fehlgeschlagen';
        
        // Extract error message from various possible formats
        if (data.error?.message) {
          errorMessage = data.error.message;
        } else if (data.error?.error?.message) {
          errorMessage = data.error.error.message;
        } else if (data.message) {
          errorMessage = data.message;
        } else if (typeof data.error === 'string') {
          errorMessage = data.error;
        } else if (data.error) {
          errorMessage = JSON.stringify(data.error);
        }
        
        console.error('Verification error:', {
          status: response.status,
          statusText: response.statusText,
          data,
          errorMessage,
        });
        
        setErrorMessage(errorMessage);
        setVerificationStatus('error');
        Alert.alert('Fehler', errorMessage);
        return;
      }

      console.log('Verification successful!');

      // Success - reload session to get updated user data
      setVerificationStatus('success');
      const session = await authClient.getSession();
      
      if (session?.data?.user?.emailVerified) {
        // Redirect to protected area after a short delay to show success message
        setTimeout(() => {
          router.replace('/(protected)/(tabs)');
        }, 2000);
      }
    } catch (error: any) {
      const msg = error?.message || 'Fehler bei der E-Mail-Verifizierung';
      setErrorMessage(msg);
      setVerificationStatus('error');
      Alert.alert('Fehler', msg);
    } finally {
      setIsVerifying(false);
    }
  };

  // Show loading while auth is loading
  if (authLoading) {
    return (
      <View className="flex-1 justify-center items-center" style={{ backgroundColor: baseColors.background }}>
        <ActivityIndicator size="large" color={baseColors.primary} />
      </View>
    );
  }

  // If user is already verified, redirect to protected area
  if (!authLoading && user?.emailVerified) {
    return <Redirect href="/(protected)/(tabs)" />;
  }

  return (
    <View className="flex-1 justify-center px-6" style={{ backgroundColor: baseColors.background }}>
      {verificationStatus === 'idle' && isVerifying && (
        <View className="items-center">
          <ActivityIndicator size="large" color={baseColors.primary} />
          <Text className="text-gray-600 text-center mt-4">
            E-Mail wird verifiziert...
          </Text>
        </View>
      )}

      {verificationStatus === 'success' && (
        <View className="items-center">
          <View className="mb-6 p-6 rounded-lg" style={{ backgroundColor: '#d1fae5', borderWidth: 1, borderColor: '#10b981' }}>
            <Text className="text-2xl font-bold text-green-800 text-center mb-2">
              ✓ E-Mail erfolgreich bestätigt!
            </Text>
            <Text className="text-green-700 text-center">
              Dein Konto wurde aktiviert. Du wirst weitergeleitet...
            </Text>
          </View>
        </View>
      )}

      {verificationStatus === 'error' && (
        <View className="mb-8">
          <View className="mb-6 p-6 rounded-lg" style={{ backgroundColor: '#fee2e2', borderWidth: 1, borderColor: '#fca5a5' }}>
            <Text className="text-xl font-bold text-red-800 text-center mb-2">
              Verifizierung fehlgeschlagen
            </Text>
            {errorMessage && (
              <Text className="text-red-700 text-center mb-4">
                {errorMessage}
              </Text>
            )}
            <Text className="text-red-600 text-sm text-center">
              Der Verifizierungslink könnte abgelaufen oder ungültig sein. Bitte fordere einen neuen Link an.
            </Text>
          </View>

          {!params.token && (
            <TouchableOpacity
              className="rounded-lg py-4 mb-4"
              style={{ backgroundColor: baseColors.primary }}
              onPress={handleVerifyEmail}
              disabled={isVerifying}
            >
              {isVerifying ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="text-white text-center font-semibold text-lg">
                  Erneut versuchen
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      )}

      {verificationStatus === 'idle' && !isVerifying && !params.token && (
        <View className="mb-8">
          <Text className="text-2xl font-bold text-gray-800 mb-4 text-center">
            E-Mail-Verifizierung
          </Text>
          <Text className="text-gray-600 text-center mb-6">
            Kein Verifizierungstoken gefunden. Bitte verwende den Link aus der E-Mail.
          </Text>
        </View>
      )}

      <View className="mt-6 flex-row justify-center">
        <Text className="text-gray-600">Zurück zur </Text>
        <Link href="/(auth)/login" asChild>
          <TouchableOpacity>
            <Text className="font-semibold" style={{ color: baseColors.primary }}>
              Anmeldung
            </Text>
          </TouchableOpacity>
        </Link>
      </View>
    </View>
  );
}

