import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Link, useRouter } from 'expo-router';
import baseColors from '@/baseColors.config';
import { useAuth } from '@/hooks/use-auth';

export default function SigninScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { signIn } = useAuth();

  const handleSignin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      await signIn(email, password);
      router.replace('/(protected)/(tabs)');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Sign in failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1 justify-center px-6" style={{ backgroundColor: baseColors.background }}>
      <View className="mb-8">
        <Text className="text-3xl font-bold text-gray-800 mb-2">
          Welcome Back
        </Text>
        <Text className="text-gray-600">
          Sign in to your Empathy Link account
        </Text>
      </View>

      <View className="mb-6">
        <Text className="text-gray-700 mb-2 font-medium">Email</Text>
        <TextInput
          className="border border-gray-300 rounded-lg px-4 py-3 text-gray-800"
          value={email}
          onChangeText={setEmail}
          placeholder="Enter your email"
          keyboardType="email-address"
          autoCapitalize="none"
          style={{ backgroundColor: '#ffffff' }}
        />
      </View>

      <View className="mb-8">
        <Text className="text-gray-700 mb-2 font-medium">Password</Text>
        <TextInput
          className="border border-gray-300 rounded-lg px-4 py-3 text-gray-800"
          value={password}
          onChangeText={setPassword}
          placeholder="Enter your password"
          secureTextEntry
          style={{ backgroundColor: '#ffffff' }}
        />
      </View>

      <TouchableOpacity
        className={`rounded-lg py-4 ${isLoading ? 'opacity-50' : ''}`}
        style={{ backgroundColor: baseColors.primary }}
        onPress={handleSignin}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text className="text-white text-center font-semibold text-lg">
            Sign In
          </Text>
        )}
      </TouchableOpacity>

      <View className="mt-6 flex-row justify-center">
        <Text className="text-gray-600">Don't have an account? </Text>
        <Link href="/(auth)/signup" asChild>
          <TouchableOpacity>
            <Text className="font-semibold" style={{ color: baseColors.primary }}>
              Sign Up
            </Text>
          </TouchableOpacity>
        </Link>
      </View>
    </View>
  );
}