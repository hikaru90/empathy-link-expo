import baseColors from '@/baseColors.config';
import LoadingIndicator from '@/components/LoadingIndicator';
import { useAuth } from '@/hooks/use-auth';
import { Link, useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function SignupScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { signUp } = useAuth();
  const router = useRouter();
  
  const nameInputRef = useRef<TextInput>(null);
  const emailInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);

  const handleSignup = async () => {
    // Clear any previous error
    setErrorMessage(null);
    
    if (!email || !password || !name) {
      const msg = 'Bitte fülle alle Felder aus';
      setErrorMessage(msg);
      Alert.alert('Fehler', msg);
      return;
    }

    // Frontend validation - check password length before submitting
    if (password.length < 8) {
      const msg = 'Das Passwort muss mindestens 8 Zeichen lang sein';
      setErrorMessage(msg);
      Alert.alert('Fehler', msg);
      return;
    }

    // Trim password to remove any accidental whitespace
    const trimmedPassword = password.trim();
    
    // Double-check password length after trimming
    if (trimmedPassword.length < 8) {
      const msg = 'Das Passwort muss mindestens 8 Zeichen lang sein (nach Entfernen von Leerzeichen)';
      setErrorMessage(msg);
      Alert.alert('Fehler', msg);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    
    // Blur all inputs to prevent focus issues during navigation
    nameInputRef.current?.blur();
    emailInputRef.current?.blur();
    passwordInputRef.current?.blur();
    
    try {
      // Use trimmed password to avoid whitespace issues
      const result = await signUp(email, trimmedPassword, name);
      // Wait a bit for state to update, then navigate
      setTimeout(() => {
        if (result.needsVerification) {
          // Redirect to login with query params to show verification email sent message
          router.replace(`/(auth)/login?initial=true&email=${encodeURIComponent(email)}`);
        } else {
          router.replace('/(protected)/(tabs)');
        }
      }, 100);
    } catch (error: any) {
      // Extract error message from various possible formats
      let msg = 'Registrierung fehlgeschlagen';
      
      if (error instanceof Error) {
        msg = error.message;
      } else if (error?.message) {
        msg = error.message;
      } else if (error?.error?.message) {
        msg = error.error.message;
      }
      
      // Display error in UI and Alert
      setErrorMessage(msg);
      Alert.alert('Fehler', msg);
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1 justify-center px-6" style={{ backgroundColor: baseColors.background }}>
      <View className="mb-8">
        <Text className="text-3xl font-bold text-gray-800 mb-2">
          Konto erstellen
        </Text>
        <Text className="text-gray-600">
          Registriere dich, um mit Empathy Link zu beginnen
        </Text>
      </View>

      {errorMessage && (
        <View className="mb-4 p-4 rounded-lg" style={{ backgroundColor: '#fee2e2', borderWidth: 1, borderColor: '#fca5a5' }}>
          <Text className="text-red-700 font-medium text-center">
            {errorMessage}
          </Text>
        </View>
      )}

      <View className="mb-6">
        <Text className="text-gray-700 mb-2 font-medium">Name</Text>
        <TextInput
          ref={nameInputRef}
          className="border border-gray-300 rounded-lg px-4 py-3 text-gray-800"
          value={name}
          onChangeText={setName}
          placeholder="Name eingeben"
          autoCapitalize="words"
          returnKeyType="next"
          onSubmitEditing={() => emailInputRef.current?.focus()}
          style={{ backgroundColor: '#ffffff' }}
        />
      </View>

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
          onSubmitEditing={handleSignup}
          style={{ backgroundColor: '#ffffff' }}
        />
      </View>

      <TouchableOpacity
        className={`rounded-lg py-4 ${isLoading ? 'opacity-50' : ''}`}
        style={{ backgroundColor: baseColors.primary }}
        onPress={handleSignup}
        disabled={isLoading}
        accessibilityRole="button"
        accessibilityLabel="Konto erstellen"
        accessibilityState={{ disabled: isLoading }}
        testID="signup-button"
      >
        {isLoading ? (
          <LoadingIndicator inline />
        ) : (
          <Text className="text-white text-center font-semibold text-lg">
            Konto erstellen
          </Text>
        )}
      </TouchableOpacity>

      <View className="mt-6 flex-row justify-center">
        <Text className="text-gray-600">Bereits ein Konto? </Text>
        <Link href="/(auth)/login" asChild>
          <TouchableOpacity>
            <Text className="font-semibold" style={{ color: baseColors.primary }}>
              Anmelden
            </Text>
          </TouchableOpacity>
        </Link>
      </View>
    </View>
  );
}