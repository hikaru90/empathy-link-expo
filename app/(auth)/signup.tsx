import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Link, useRouter } from 'expo-router';
import baseColors from '@/baseColors.config';
import { useAuth } from '@/hooks/use-auth';

export default function SignupScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { signUp } = useAuth();

  const handleSignup = async () => {
    if (!email || !password || !name) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters long');
      return;
    }

    setIsLoading(true);
    try {
      await signUp(email, password, name);
      // Navigate immediately on success
      router.replace('/(protected)/(tabs)');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Sign up failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1 justify-center px-6" style={{ backgroundColor: baseColors.background }}>
      <View className="mb-8">
        <Text className="text-3xl font-bold text-gray-800 mb-2">
          Create Account
        </Text>
        <Text className="text-gray-600">
          Sign up to get started with Empathy Link
        </Text>
      </View>

      <View className="mb-6">
        <Text className="text-gray-700 mb-2 font-medium">Name</Text>
        <TextInput
          className="border border-gray-300 rounded-lg px-4 py-3 text-gray-800"
          value={name}
          onChangeText={setName}
          placeholder="Enter your name"
          autoCapitalize="words"
          style={{ backgroundColor: '#ffffff' }}
        />
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
        <Text className="text-gray-500 text-sm mt-1">
          Password must be at least 8 characters long
        </Text>
      </View>

      <TouchableOpacity
        className={`rounded-lg py-4 ${isLoading ? 'opacity-50' : ''}`}
        style={{ backgroundColor: baseColors.primary }}
        onPress={handleSignup}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text className="text-white text-center font-semibold text-lg">
            Create Account
          </Text>
        )}
      </TouchableOpacity>

      <View className="mt-6 flex-row justify-center">
        <Text className="text-gray-600">Already have an account? </Text>
        <Link href="/(auth)/login" asChild>
          <TouchableOpacity>
            <Text className="font-semibold" style={{ color: baseColors.primary }}>
              Sign In
            </Text>
          </TouchableOpacity>
        </Link>
      </View>
    </View>
  );
}