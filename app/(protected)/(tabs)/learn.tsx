import { ActivityIndicator, Text, View } from 'react-native';

import baseColors from '@/baseColors.config';
import Header from '@/components/Header';
import { useAuthGuard } from '@/hooks/use-auth';

export default function LearnScreen() {
  const { isAuthenticated, isLoading, user } = useAuthGuard();

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center" style={{ backgroundColor: baseColors.background }}>
        <ActivityIndicator size="large" color={baseColors.primary} />
        <Text className="text-gray-600 mt-4">Loading...</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to auth
  }

  return (
    <View className="flex-1" style={{ backgroundColor: baseColors.background }}>
      <Header />
      <View className="flex-1 justify-center items-center">
      <Text className="text-xl font-semibold text-gray-800">
        Lernen
      </Text>
      <Text className="text-gray-600 mt-2">
        Learning modules coming soon...
      </Text>
      </View>
    </View>
  );
}