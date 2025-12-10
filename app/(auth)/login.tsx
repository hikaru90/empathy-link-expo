import baseColors from '@/baseColors.config';
import { useAuth } from '@/hooks/use-auth';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Text, TextInput, TouchableOpacity, View } from 'react-native';

// Helper function to parse query parameters from URL
// On web, Expo Router uses hash-based routing, so we need to check both location.search and hash
// Also check sessionStorage in case query params were stored before hash conversion
function parseQueryParams(): Record<string, string> {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const params: Record<string, string> = {};
    
    // First check sessionStorage (stored before hash conversion)
    try {
      const stored = sessionStorage.getItem('login_query_params');
      if (stored) {
        const storedParams = JSON.parse(stored);
        Object.assign(params, storedParams);
        // Clear after reading
        sessionStorage.removeItem('login_query_params');
      }
    } catch (e) {
      // Ignore sessionStorage errors
    }
    
    // Then try window.location.search (standard query params)
    if (window.location.search) {
      const searchParams = new URLSearchParams(window.location.search);
      searchParams.forEach((value, key) => {
        params[key] = value;
      });
    }
    
    // Also check hash for hash-based routing (Expo Router on web uses hash)
    if (window.location.hash) {
      const hash = window.location.hash.substring(1); // Remove the #
      const hashParts = hash.split('?');
      if (hashParts.length > 1) {
        const hashParams = new URLSearchParams(hashParts[1]);
        hashParams.forEach((value, key) => {
          // Only override if not already set
          if (!params[key]) {
            params[key] = value;
          }
        });
      }
    }
    
    return params;
  }
  return {};
}

export default function SigninScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showResendButton, setShowResendButton] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const { signIn, resendVerificationEmail } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams<{ fromSignup?: string; email?: string; initial?: string; pop?: string; path?: string }>();
  
  // Parse query params manually (for web platform where useLocalSearchParams might not work)
  // Parse synchronously on every render to catch URL changes
  const queryParams = parseQueryParams();
  
  // Check if we're coming from signup (via query params or URL)
  // Handle both string and array formats from useLocalSearchParams, and also manual query parsing
  const initialParam = queryParams.initial || (Array.isArray(params.initial) ? params.initial[0] : params.initial);
  const fromSignupParam = queryParams.fromSignup || (Array.isArray(params.fromSignup) ? params.fromSignup[0] : params.fromSignup);
  // Check for 'true' string or boolean true, and also check for '1' as some systems use that
  const isFromSignup = 
    fromSignupParam === 'true' || 
    fromSignupParam === true ||
    fromSignupParam === '1' ||
    initialParam === 'true' || 
    initialParam === true ||
    initialParam === '1';
  
  useEffect(() => {
    if (__DEV__) {
      console.log('=== Login Page Debug ===');
      console.log('Full URL:', Platform.OS === 'web' && typeof window !== 'undefined' ? window.location.href : 'N/A');
      console.log('Search:', Platform.OS === 'web' && typeof window !== 'undefined' ? window.location.search : 'N/A');
      console.log('Hash:', Platform.OS === 'web' && typeof window !== 'undefined' ? window.location.hash : 'N/A');
      console.log('Query params parsed:', queryParams);
      console.log('useLocalSearchParams:', params);
      console.log('initial param:', initialParam);
      console.log('fromSignup param:', fromSignupParam);
      console.log('isFromSignup:', isFromSignup);
      console.log('=======================');
    }
  }, [queryParams, initialParam, fromSignupParam, isFromSignup, params]);
  
  const emailInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);

  // Debug: Log when component renders
  React.useEffect(() => {
    if (__DEV__) {
      console.log('SigninScreen rendered');
      console.log('useLocalSearchParams:', params);
      console.log('Manual query params:', queryParams);
      console.log('initial param:', initialParam);
      console.log('fromSignup param:', fromSignupParam);
      console.log('isFromSignup:', isFromSignup);
      console.log('window.location:', Platform.OS === 'web' && typeof window !== 'undefined' ? window.location.href : 'N/A');
    }
  }, [params, queryParams, initialParam, fromSignupParam, isFromSignup]);

  // Set email from query params if available (from signup redirect)
  React.useEffect(() => {
    const emailFromParams = queryParams.email || (Array.isArray(params.email) ? params.email[0] : params.email);
    if (emailFromParams && !email) {
      setEmail(emailFromParams);
    }
  }, [queryParams.email, params.email, email]);

  const handleResendVerification = async () => {
    if (!email) {
      Alert.alert('Fehler', 'Bitte gib deine E-Mail-Adresse ein');
      return;
    }

    setIsResending(true);
    setResendSuccess(false);
    try {
      await resendVerificationEmail(email);
      setResendSuccess(true);
      Alert.alert('Erfolg', 'Bestätigungs-E-Mail wurde erneut gesendet. Bitte überprüfe dein Postfach.');
    } catch (error: any) {
      const msg = error?.message || 'Fehler beim Senden der Bestätigungs-E-Mail';
      Alert.alert('Fehler', msg);
    } finally {
      setIsResending(false);
    }
  };

  const handleSignin = async () => {
    console.log('handleSignin called');
    // Clear any previous error and resend state
    setErrorMessage(null);
    setShowResendButton(false);
    setResendSuccess(false);
    
    if (!email || !password) {
      const msg = 'Bitte fülle alle Felder aus';
      setErrorMessage(msg);
      Alert.alert('Fehler', msg);
      return;
    }

    setIsLoading(true);
    try {
      console.log('About to call signIn');
      const result = await signIn(email, password);
      console.log('signIn returned successfully:', result);
      // Wait a bit for state to update, then navigate
      setTimeout(() => {
        console.log('result',result);
        if (result.needsVerification) {
          router.replace('/(auth)/verify-email');
        } else {
          router.replace('/(protected)/(tabs)');
        }
      }, 100);
    } catch (error: any) {
      console.log('catch block executed, error:', error);
      // Extract error message from various possible formats
      let msg = 'Anmeldung fehlgeschlagen';
      let is403Error = false;
      
      // Get status code and message
      const status = (error as any)?.status || error?.error?.status;
      const errorMsg = error?.message || error?.error?.message || (error instanceof Error ? error.message : '');
      
      if (errorMsg) {
        msg = errorMsg;
      }
      
      // Check if it's a 403 error about email verification
      // The backend translates this to: "Deine E-Mail-Adresse wurde noch nicht verifiziert..."
      console.log('is403Error',is403Error);
      is403Error = status === 403 || 
                   msg.includes('nicht verifiziert') || 
                   msg.includes('E-Mail-Postfach') ||
                   msg.toLowerCase().includes('email not verified') ||
                   msg.toLowerCase().includes('email verification required');
      
      if (__DEV__) {
        console.log('Login error:', { status, msg, is403Error });
      }
      
      // Display error in UI and Alert
      setErrorMessage(msg);
      setShowResendButton(is403Error);
      Alert.alert('Fehler', msg);
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1 justify-center px-6" style={{ backgroundColor: baseColors.background }}>
      <View className="mb-8">
        <Text className="text-3xl font-bold text-gray-800 mb-2 text-center">
          Willkommen zurück
        </Text>
        <Text className="text-gray-600 text-center">
          Melde dich in deinem Empathy Link Konto an
        </Text>
      </View>

      {isFromSignup && (
        <View className="mb-4 p-4 rounded-lg" style={{ backgroundColor: '#dbeafe', borderWidth: 1, borderColor: '#60a5fa' }}>
          <Text className="text-blue-800 font-semibold text-center mb-2">
            ✓ Registrierung erfolgreich!
          </Text>
          <Text className="text-blue-700 text-center text-sm">
            Wir haben eine Bestätigungs-E-Mail an deine E-Mail-Adresse gesendet. Bitte überprüfe dein Postfach und klicke auf den Link, um dein Konto zu aktivieren.
          </Text>
          <Text className="text-blue-600 text-center text-xs mt-2">
            Tipp: Überprüfe auch deinen Spam-Ordner, falls die E-Mail nicht angekommen ist.
          </Text>
        </View>
      )}

      {errorMessage && (
        <View className="mb-4 p-4 rounded-lg" style={{ backgroundColor: '#fee2e2', borderWidth: 1, borderColor: '#fca5a5' }}>
          <Text className="text-red-700 font-medium text-center mb-2">
            {errorMessage}
          </Text>
          {showResendButton && (
            <TouchableOpacity
              className="mt-3 py-2 px-4 rounded-lg"
              style={{ backgroundColor: baseColors.primary }}
              onPress={handleResendVerification}
              disabled={isResending}
            >
              {isResending ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="text-white text-center font-semibold">
                  Bestätigungslink erneut senden?
                </Text>
              )}
            </TouchableOpacity>
          )}
          {resendSuccess && (
            <Text className="text-green-700 text-sm text-center mt-2">
              ✓ Bestätigungs-E-Mail wurde gesendet
            </Text>
          )}
        </View>
      )}

      <View className="mb-6">
        <Text className="text-gray-700 mb-2 font-medium">E-Mail</Text>
        <TextInput
          ref={emailInputRef}
          className="border border-gray-300 rounded-lg px-4 py-3 text-gray-800"
          value={email}
          onChangeText={setEmail}
          placeholder="E-Mail eingeben"
          keyboardType="email-address"
          autoCapitalize="none"
          returnKeyType="next"
          onSubmitEditing={() => passwordInputRef.current?.focus()}
          style={{ backgroundColor: '#ffffff' }}
        />
      </View>

      <View className="mb-8">
        <Text className="text-gray-700 mb-2 font-medium">Passwort</Text>
        <TextInput
          ref={passwordInputRef}
          className="border border-gray-300 rounded-lg px-4 py-3 text-gray-800"
          value={password}
          onChangeText={setPassword}
          placeholder="Passwort eingeben"
          secureTextEntry
          returnKeyType="done"
          onSubmitEditing={handleSignin}
          style={{ backgroundColor: '#ffffff' }}
        />
      </View>

      <View className="flex-row justify-center">
        <TouchableOpacity
          className={`rounded-full py-2 px-6 ${isLoading ? 'opacity-50' : ''}`}
          style={{ backgroundColor: baseColors.primary }}
          onPress={() => {
            console.log('Button pressed, calling handleSignin');
            handleSignin();
          }}
          disabled={isLoading}
          accessibilityRole="button"
          accessibilityLabel="Anmelden"
          accessibilityState={{ disabled: isLoading }}
          testID="signin-button"
        >
          {isLoading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text className="text-white text-center font-semibold text-lg">
              Anmelden
            </Text>
          )}
        </TouchableOpacity>
      </View>
      <View className="mt-6 flex-row justify-center">
        <Text className="text-gray-600">Noch kein Konto? </Text>
        <Link href="/(auth)/signup" asChild>
          <TouchableOpacity>
            <Text className="font-semibold" style={{ color: baseColors.primary }}>
              Registrieren
            </Text>
          </TouchableOpacity>
        </Link>
      </View>
    </View>
  );
}