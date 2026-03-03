import { Link } from 'expo-router';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuthGuard } from '@/hooks/use-auth';
import baseColors from '@/baseColors.config';
import LoadingIndicator from '@/components/LoadingIndicator';

export default function ModalScreen() {
  const { isAuthenticated, isLoading } = useAuthGuard();

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <LoadingIndicator />
      </ThemedView>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to auth
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">This is a modal</ThemedText>
      <Link href="/" dismissTo style={styles.link}>
        <ThemedText type="link">Go to home screen</ThemedText>
      </Link>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
});
