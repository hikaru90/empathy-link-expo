import baseColors from '@/baseColors.config';
import LoadingIndicator from '@/components/LoadingIndicator';
import { useAuth } from '@/hooks/use-auth';
import { authClient } from '@/lib/auth';
import { Link, Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Text, TouchableOpacity, View } from 'react-native';

export default function VerifyEmailTokenScreen() {
  const { user, isLoading: authLoading, refresh } = useAuth();
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
      console.log('[Verify Debug] Starting verification with token:', params.token?.substring(0, 10) + '...');
      
      if (!params.token) {
        throw new Error('No token provided');
      }

      // According to Better Auth docs:
      // await authClient.verifyEmail({ query: { token: "..." } })
      console.log('[Verify Debug] Calling authClient.verifyEmail');
      const verifyResult = await authClient.verifyEmail({
        query: {
          token: params.token,
        },
      });

      if (verifyResult.error) {
        console.error('[Verify Debug] Verification result error:', verifyResult.error);
        throw verifyResult.error;
      }

      console.log('[Verify Debug] Verification API call finished successfully:', verifyResult);

      // Success - reload session to get updated user data
      setVerificationStatus('success');
      
      console.log('[Verify Debug] Triggering auth refresh...');
      // Refresh the auth context to update the user state across the app
      refresh();
      
      // Also check session manually just in case
      console.log('[Verify Debug] Manual session check...');
      const session = await authClient.getSession();
      console.log('[Verify Debug] Session after verification:', {
        exists: !!session?.data?.user,
        email: session?.data?.user?.email,
        verified: session?.data?.user?.emailVerified
      });
      
      // Redirect to protected area after a short delay to show success message
      setTimeout(() => {
        console.log('[Verify Debug] Redirecting to protected area...');
        router.replace('/(protected)/(tabs)');
      }, 5000);
    } catch (error: any) {
      console.error('[Verify Debug] Final catch error:', error);
      
      let errorMessage = 'E-Mail-Verifizierung fehlgeschlagen';
      
      // Handle better-auth error format
      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.error?.message) {
        errorMessage = error.error.message;
      }
      
      setErrorMessage(errorMessage);
      setVerificationStatus('error');
      Alert.alert('Fehler', errorMessage);
    } finally {
      setIsVerifying(false);
    }
  };

  // Show loading while auth is loading
  if (authLoading) {
    return (
      <View className="flex-1 justify-center items-center" style={{ backgroundColor: baseColors.background }}>
        <LoadingIndicator />
      </View>
    );
  }

  // If user is already verified, redirect to protected area
  if (!authLoading && user?.emailVerified && verificationStatus !== 'success') {
    return <Redirect href="/(protected)/(tabs)" />;
  }

  return (
    <View className="flex-1 justify-center px-6" style={{ backgroundColor: baseColors.background }}>
      {verificationStatus === 'idle' && isVerifying && (
        <View className="items-center">
          <LoadingIndicator />
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
                <ActivityIndicator size="small" color="#fff" />
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

