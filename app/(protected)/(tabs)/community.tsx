import { Text, View } from 'react-native';

import baseColors from '@/baseColors.config';
import LoadingIndicator from '@/components/LoadingIndicator';
import { useAuthGuard } from '@/hooks/use-auth';

export default function CommunityScreen() {
  const { isAuthenticated, isLoading, user } = useAuthGuard();

  if (isLoading) {
    return (
      <View className="flex-1" style={{ backgroundColor: baseColors.background }}>
        <View className="flex-1 justify-center items-center -mt-6">
          <LoadingIndicator />
        </View>
      </View>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to auth
  }

  return (
    <View className="flex-1" style={{ backgroundColor: baseColors.background }}>
      <View className="flex-1 justify-center items-center">
        <Text className="text-xl font-semibold text-gray-800">
          Community
        </Text>
        <Text className="text-gray-600 mt-2">
          Community features coming soon...
        </Text>
      </View>
    </View>
  );
}