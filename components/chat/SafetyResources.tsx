/**
 * Crisis resources and appeal UI for safety mechanism.
 * Shown when showResources or suspended is true.
 */

import baseColors from '@/baseColors.config';
import type { CrisisResource } from '@/lib/api/safety';
import { openBrowserAsync, WebBrowserPresentationStyle } from 'expo-web-browser';
import { Alert, Linking, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface SafetyResourcesProps {
  resources: CrisisResource[];
  suspended: boolean;
  onAppeal: () => Promise<{ success: boolean; message: string }>;
  appealInProgress?: boolean;
  /** When true, use compact styling for banner display (less top padding) */
  compact?: boolean;
}

function openUrl(url: string) {
  if (url.startsWith('tel:')) {
    Linking.openURL(url);
  } else {
    openBrowserAsync(url, { presentationStyle: WebBrowserPresentationStyle.AUTOMATIC });
  }
}

export default function SafetyResources({
  resources,
  suspended,
  onAppeal,
  appealInProgress = false,
  compact = false,
}: SafetyResourcesProps) {
  const handleAppeal = async () => {
    try {
      const result = await onAppeal();
      Alert.alert(
        result.success ? 'Anfrage gesendet' : 'Hinweis',
        result.message,
        [{ text: 'OK' }]
      );
    } catch (err) {
      Alert.alert(
        'Fehler',
        err instanceof Error ? err.message : 'Die Anfrage konnte nicht gesendet werden.',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <View
      style={[
        styles.container,
        suspended && styles.containerSuspended,
        compact && styles.containerCompact,
      ]}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <Text style={styles.heading}>
            {suspended
              ? 'Dein Zugang wurde vorübergehend eingeschränkt'
              : 'Wir kümmern uns um dein Wohlbefinden'}
          </Text>
          <Text style={styles.subheading}>
            {suspended
              ? 'Empathy Link ist kein Krisendienst und kann professionelle Hilfe nicht ersetzen. Bitte wende dich an eine der folgenden Anlaufstellen.'
              : 'Diese Ressourcen können dir in schwierigen Momenten helfen.'}
          </Text>
          <Text style={styles.disclaimer}>
            Empathy Link ist kein Krisendienst und kein Ersatz für professionelle psychologische oder medizinische Betreuung.
          </Text>

          {resources.length > 0 ? (
            <View style={styles.resourceList}>
              {resources.map((r, i) => (
                <View key={i} style={styles.resourceItem}>
                  <Text style={styles.resourceName}>{r.name}</Text>
                  {r.description ? (
                    <Text style={styles.resourceDesc}>{r.description}</Text>
                  ) : null}
                  {r.phone ? (
                    <TouchableOpacity
                      onPress={() => openUrl(`tel:${r.phone!.replace(/\s/g, '')}`)}
                      style={styles.linkButton}
                    >
                      <Text style={styles.linkText}>📞 {r.phone}</Text>
                    </TouchableOpacity>
                  ) : null}
                  {r.url ? (
                    <TouchableOpacity
                      onPress={() => openUrl(r.url!)}
                      style={styles.linkButton}
                    >
                      <Text style={styles.linkText}>🔗 {r.url}</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.fallbackResources}>
              <View style={styles.resourceItem}>
                <Text style={styles.resourceName}>Telefonseelsorge</Text>
                <Text style={styles.resourceDesc}>Kostenlose Beratung bei Krisen</Text>
                <TouchableOpacity
                  onPress={() => openUrl('tel:08001110111')}
                  style={styles.linkButton}
                >
                  <Text style={styles.linkText}>📞 0800 111 0 111 / 0800 111 0 222</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.resourceItem}>
                <Text style={styles.resourceName}>Find a Helpline</Text>
                <Text style={styles.resourceDesc}>International crisis support</Text>
                <TouchableOpacity
                  onPress={() => openUrl('https://findahelpline.com')}
                  style={styles.linkButton}
                >
                  <Text style={styles.linkText}>🔗 findahelpline.com</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {suspended && (
            <TouchableOpacity
              onPress={handleAppeal}
              disabled={appealInProgress}
              style={[styles.appealButton, appealInProgress && styles.appealButtonDisabled]}
            >
              <Text style={styles.appealButtonText}>
                {appealInProgress ? 'Wird gesendet…' : 'Zugang wiederherstellen anfragen'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'ios' ? 90 : Platform.OS === 'android' ? 110 : 70,
  },
  containerSuspended: {
    flex: 1,
    paddingBottom: 40,
  },
  containerCompact: {
    paddingTop: 8,
    paddingVertical: 8,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  card: {
    backgroundColor: baseColors.offwhite,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  heading: {
    fontSize: 18,
    fontWeight: '600',
    color: baseColors.black,
    marginBottom: 8,
  },
  subheading: {
    fontSize: 15,
    color: baseColors.black,
    opacity: 0.85,
    marginBottom: 12,
    lineHeight: 22,
  },
  disclaimer: {
    fontSize: 13,
    color: baseColors.black,
    opacity: 0.65,
    fontStyle: 'italic',
    marginBottom: 20,
    lineHeight: 19,
  },
  resourceList: {
    gap: 16,
  },
  fallbackResources: {
    gap: 16,
  },
  resourceItem: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  resourceName: {
    fontSize: 16,
    fontWeight: '600',
    color: baseColors.black,
    marginBottom: 4,
  },
  resourceDesc: {
    fontSize: 14,
    color: baseColors.black,
    opacity: 0.75,
    marginBottom: 8,
  },
  linkButton: {
    marginTop: 4,
  },
  linkText: {
    fontSize: 14,
    color: baseColors.emerald,
    fontWeight: '500',
  },
  appealButton: {
    marginTop: 24,
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: baseColors.primary,
    borderRadius: 12,
    alignItems: 'center',
  },
  appealButtonDisabled: {
    opacity: 0.6,
  },
  appealButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: baseColors.offwhite,
  },
});
