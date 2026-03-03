import jungleImage from '@/assets/images/Jungle.jpg';
import baseColors from '@/baseColors.config';
import SparklePill from '@/components/SparklePill';
import { useAuth } from '@/hooks/use-auth';
import { Link, useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { ActivityIndicator, Alert, ImageBackground, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

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
        <View className="items-center mb-4 flex-row gap-2 justify-center">
          <Text
            style={{
              fontWeight: 'bold',
              fontSize: 22,
              color: baseColors.forest,
              letterSpacing: 1,
            }}
          >
            Empathy
          </Text>
          <View style={{ marginBottom: -2 }}>
            <SparklePill />
          </View>
          <Text style={{
            fontWeight: 'bold',
            fontSize: 22,
            color: baseColors.forest,
            letterSpacing: 1,
          }}>
            Link
          </Text>
        </View>
        <Text className="text-center" style={{ color: baseColors.forest + '99' }}>
          Registriere dich.
        </Text>
      </View>

      {errorMessage && (
        <View className="mb-4 p-4 rounded-lg" style={{ backgroundColor: '#fee2e2', borderWidth: 1, borderColor: '#fca5a5' }}>
          <Text className="text-red-700 font-medium text-center">
            {errorMessage}
          </Text>
        </View>
      )}

      <View className="mb-4">
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

      <View className="mb-4">
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

      <View className="flex-row justify-center">
        <TouchableOpacity
          onPress={handleSignup}
          disabled={isLoading}
          accessibilityRole="button"
          accessibilityLabel="Konto erstellen"
          accessibilityState={{ disabled: isLoading }}
          testID="signup-button"
          style={{
            width: '100%',
            maxWidth: 300,
            height: 48,
            opacity: isLoading ? 0.5 : 1,
          }}
        >
          <ImageBackground source={jungleImage} resizeMode="cover" style={{
            flex: 1,
            height: '100%',
            width: '100%',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            paddingVertical: 12,
            paddingHorizontal: 24,
            borderRadius: 999,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: 'rgba(0, 0, 0, 0.1)',
          }}>
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Text style={{
                  fontSize: 16,
                  color: baseColors.offwhite,
                  fontWeight: '600',
                }}>Konto erstellen</Text>
              </>
            )}
          </ImageBackground>
        </TouchableOpacity>
      </View>

      <View className="mt-6 flex-row justify-center">
        <Text className="" style={{ color: baseColors.forest + '99' }}>Bereits ein Konto? </Text>
        <Link href="/(auth)/login" asChild>
          <TouchableOpacity>
            <Text className="font-semibold" style={{ color: baseColors.forest }}>
              Anmelden
            </Text>
          </TouchableOpacity>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  finishButtonContainer: {
    width: '100%',
    maxWidth: 300,
    height: 48,
  },
  finishButtonText: {
    fontSize: 14,
    color: baseColors.offwhite,
  },
  checkIcon: {
    backgroundColor: 'rgba(255, 255, 255, 0.27)',
    padding: 3,
    borderRadius: 999,
  },
});