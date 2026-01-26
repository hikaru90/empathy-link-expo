import baseColors from '@/baseColors.config';
import LoadingIndicator from '@/components/LoadingIndicator';
import { authClient } from '@/lib/auth';
import { Link, Redirect, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '@/hooks/use-auth';

export default function VerifyEmailScreen() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(false);

  // Redirect if user is verified or not logged in
  if (!authLoading && user?.emailVerified) {
    return <Redirect href="/(protected)/(tabs)" />;
  }
  if (!authLoading && !user) {
    return <Redirect href="/(auth)/login" />;
  }

  const handleCheckVerification = async () => {
    setIsChecking(true);
    try {
      // Reload session to check if email is now verified
      const session = await authClient.getSession();
      
      if (session?.data?.user?.emailVerified) {
        router.replace('/(protected)/(tabs)');
      } else {
        setIsChecking(false);
      }
    } catch (error) {
      console.error('Error checking verification:', error);
      setIsChecking(false);
    }
  };

  if (authLoading) {
    return (
      <View className="flex-1 justify-center items-center" style={{ backgroundColor: baseColors.background }}>
        <LoadingIndicator />
      </View>
    );
  }

  return (
    <View className="flex-1 justify-center px-6" style={{ backgroundColor: baseColors.background }}>
      <View className="mb-8">
        <Text className="text-3xl font-bold text-gray-800 mb-4 text-center">
          E-Mail bestätigen
        </Text>
        <Text className="text-gray-600 text-center mb-2">
          Wir haben eine Bestätigungs-E-Mail an
        </Text>
        <Text className="text-gray-800 font-semibold text-center mb-2">
          {user?.email}
        </Text>
        <Text className="text-gray-600 text-center">
          gesendet. Bitte öffne den Link in der E-Mail, um dein Konto zu aktivieren.
        </Text>
      </View>

      <View className="mb-6">
        <Text className="text-gray-600 text-center text-sm mb-4">
          Hast du die E-Mail nicht erhalten? Überprüfe deinen Spam-Ordner oder klicke auf den Button unten, um die Verifizierung erneut zu prüfen.
        </Text>
      </View>

      <TouchableOpacity
        className={`rounded-lg py-4 ${isChecking ? 'opacity-50' : ''}`}
        style={{ backgroundColor: baseColors.primary }}
        onPress={handleCheckVerification}
        disabled={isChecking}
        accessibilityRole="button"
        accessibilityLabel="Verifizierung prüfen"
      >
        {isChecking ? (
          <LoadingIndicator inline />
        ) : (
          <Text className="text-white text-center font-semibold text-lg">
            Verifizierung prüfen
          </Text>
        )}
      </TouchableOpacity>

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

