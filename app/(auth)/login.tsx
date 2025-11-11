import baseColors from '@/baseColors.config';
import { useAuth } from '@/hooks/use-auth';
import { Link, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function SigninScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { signIn } = useAuth();

  const handleSignin = async () => {
    if (!email || !password) {
      Alert.alert('Fehler', 'Bitte fülle alle Felder aus');
      return;
    }

    setIsLoading(true);
    try {
      await signIn(email, password);
      router.replace('/(protected)/(tabs)');
    } catch (error: any) {
      Alert.alert('Fehler', error.message || 'Anmeldung fehlgeschlagen');
    } finally {
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

      <View className="mb-6">
        <Text className="text-gray-700 mb-2 font-medium">E-Mail</Text>
        <TextInput
          className="border border-gray-300 rounded-lg px-4 py-3 text-gray-800"
          value={email}
          onChangeText={setEmail}
          placeholder="E-Mail eingeben"
          keyboardType="email-address"
          autoCapitalize="none"
          style={{ backgroundColor: '#ffffff' }}
        />
      </View>

      <View className="mb-8">
        <Text className="text-gray-700 mb-2 font-medium">Passwort</Text>
        <TextInput
          className="border border-gray-300 rounded-lg px-4 py-3 text-gray-800"
          value={password}
          onChangeText={setPassword}
          placeholder="Passwort eingeben"
          secureTextEntry
          style={{ backgroundColor: '#ffffff' }}
        />
      </View>

      <View className="flex-row justify-center">
        <TouchableOpacity
          className={`rounded-full py-2 px-6 ${isLoading ? 'opacity-50' : ''}`}
          style={{ backgroundColor: baseColors.primary }}
          onPress={handleSignin}
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