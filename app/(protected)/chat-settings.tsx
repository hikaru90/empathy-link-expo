import baseColors from '@/baseColors.config';
import LoadingIndicator from '@/components/LoadingIndicator';
import SelectDropdown from '@/components/ui/SelectDropdown';
import { USER_GOALS } from '@/constants/onboarding';
import { getChatSettings, updateChatSettings, type ChatSettings } from '@/lib/api/chat';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const answerLengthOptions: Array<{ value: ChatSettings['aiAnswerLength']; label: string; description: string }> = [
  { value: 'short', label: 'Kurz', description: 'Prägnante, fokussierte Antworten' },
  { value: 'medium', label: 'Mittel', description: 'Ausgewogene Antworten mit Details' },
  { value: 'long', label: 'Lang', description: 'Ausführliche, detaillierte Antworten' },
];

const toneOptions: Array<{ value: ChatSettings['toneOfVoice']; label: string; description: string }> = [
  { value: 'heartfelt', label: 'Herzlich', description: 'Empathisch und unterstützend' },
  { value: 'analytical', label: 'Analytisch', description: 'Sachlich und strukturiert' },
];

const knowledgeOptions: Array<{ value: ChatSettings['nvcKnowledge']; label: string; description: string }> = [
  { value: 'beginner', label: 'Einsteiger', description: 'Grundlagen werden erklärt' },
  { value: 'intermediate', label: 'Fortgeschritten', description: 'Einige GFK-Kenntnisse vorhanden' },
  { value: 'advanced', label: 'Experte', description: 'Umfassende GFK-Kenntnisse' },
];

const userGoalOptions = [
  { value: '', label: 'Kein Ziel ausgewählt' },
  ...USER_GOALS.map((goal) => ({ value: goal, label: goal })),
];

export default function ChatSettingsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<ChatSettings>({
    aiAnswerLength: 'short',
    toneOfVoice: 'heartfelt',
    nvcKnowledge: 'beginner',
    userGoal: undefined,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const data = await getChatSettings();
      setSettings(data);
    } catch (error) {
      console.error('Failed to fetch chat settings:', error);
      // Use defaults on error
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (newSettings: ChatSettings) => {
    if (isSaving) return;

    setIsSaving(true);

    try {
      await updateChatSettings(newSettings);
      setSettings(newSettings);
    } catch (error) {
      console.error('Failed to save chat settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAnswerLengthChange = (value: string) => {
    const newSettings = {
      ...settings,
      aiAnswerLength: value as ChatSettings['aiAnswerLength'],
    };
    handleSave(newSettings);
  };

  const handleToneOfVoiceChange = (value: string) => {
    const newSettings = {
      ...settings,
      toneOfVoice: value as ChatSettings['toneOfVoice'],
    };
    handleSave(newSettings);
  };

  const handleNvcKnowledgeChange = (value: string) => {
    const newSettings = {
      ...settings,
      nvcKnowledge: value as ChatSettings['nvcKnowledge'],
    };
    handleSave(newSettings);
  };

  const handleUserGoalChange = (value: string) => {
    const newSettings = {
      ...settings,
      userGoal: value || undefined,
    };
    handleSave(newSettings);
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <LoadingIndicator />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <LinearGradient
          colors={[baseColors.background, baseColors.background + '00']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 80,
            zIndex: -1,
          }}
        />
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.push('/(protected)/(tabs)/stats');
            }
          }}
        >
          <ChevronLeft size={20} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chat-Einstellungen</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.settingsContainer}>
          {/* AI Answer Length */}
          <View style={styles.settingCard}>
            <View style={styles.settingHeader}>
              <Text style={styles.settingTitle}>Antwortlänge der KI</Text>
              <Text style={styles.settingDescription}>
                Wähle, wie ausführlich die KI antworten soll
              </Text>
            </View>
            <SelectDropdown
              options={answerLengthOptions}
              selectedValue={settings.aiAnswerLength}
              onValueChange={handleAnswerLengthChange}
              placeholder="Antwortlänge wählen"
            />
          </View>

          {/* Tone of Voice */}
          <View style={styles.settingCard}>
            <View style={styles.settingHeader}>
              <Text style={styles.settingTitle}>Gesprächston</Text>
              <Text style={styles.settingDescription}>
                Wähle den bevorzugten Kommunikationsstil der KI
              </Text>
            </View>
            <SelectDropdown
              options={toneOptions}
              selectedValue={settings.toneOfVoice}
              onValueChange={handleToneOfVoiceChange}
              placeholder="Gesprächston wählen"
            />
          </View>

          {/* NVC Knowledge Level */}
          <View style={styles.settingCard}>
            <View style={styles.settingHeader}>
              <Text style={styles.settingTitle}>GFK-Kenntnisse</Text>
              <Text style={styles.settingDescription}>
                Dein aktueller Wissensstand in Gewaltfreier Kommunikation
              </Text>
            </View>
            <SelectDropdown
              options={knowledgeOptions}
              selectedValue={settings.nvcKnowledge}
              onValueChange={handleNvcKnowledgeChange}
              placeholder="Kenntnisstand wählen"
            />
          </View>

          {/* User Goal */}
          <View style={styles.settingCard}>
            <View style={styles.settingHeader}>
              <Text style={styles.settingTitle}>Was möchtest du mit Empathy-Link erreichen?</Text>
              <Text style={styles.settingDescription}>
                Dein Ziel aus der Einführung
              </Text>
            </View>
            <SelectDropdown
              options={userGoalOptions}
              selectedValue={settings.userGoal ?? ''}
              onValueChange={handleUserGoalChange}
              placeholder="Ziel wählen"
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: baseColors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' || Platform.OS === 'android' ? 58 : 16,
    paddingBottom: 16,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  headerSpacer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#666',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 120 : 80,
    paddingBottom: 40,
  },
  settingsContainer: {
    gap: 16,
  },
  settingCard: {
    borderRadius: 16,
  },
  settingHeader: {
    marginBottom: 12,
    marginLeft: 8,
  },
  settingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
  },
});
