import { Check, MessageCirclePlus } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import baseColors from '@/baseColors.config';
import SelectInline from '@/components/ui/SelectInline';
import { useAuthGuard } from '@/hooks/use-auth';
import { submitFeedback, type FeedbackType } from '@/lib/api/feedback';

const FEEDBACK_TYPE_OPTIONS: { value: FeedbackType; label: string }[] = [
  { value: 'bug', label: 'Bug melden' },
  { value: 'improvement', label: 'Verbesserung vorschlagen' },
  { value: 'other', label: 'Sonstiges' },
];

export default function FeedbackScreen() {
  const { user } = useAuthGuard();
  const [type, setType] = useState<FeedbackType>('improvement');
  const [observation, setObservation] = useState('');
  const [feelings, setFeelings] = useState('');
  const [needs, setNeeds] = useState('');
  const [request, setRequest] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [typeSelectOpen, setTypeSelectOpen] = useState(false);

  const handleSubmit = async () => {
    const o = observation.trim();
    const f = feelings.trim();
    const n = needs.trim();
    const r = request.trim();
    if (!o && !f && !n && !r) {
      Alert.alert('Bitte ausfüllen', 'Fülle mindestens einen der vier Schritte aus.');
      return;
    }

    setSubmitting(true);
    try {
      await submitFeedback({
        type,
        observation: o || undefined,
        feelings: f || undefined,
        needs: n || undefined,
        request: r || undefined,
        metadata: { platform: Platform.OS },
      });
      setSubmitted(true);
      setObservation('');
      setFeelings('');
      setNeeds('');
      setRequest('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Feedback konnte nicht gesendet werden.';
      Alert.alert('Fehler', msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable onPress={() => typeSelectOpen && setTypeSelectOpen(false)} style={{position: 'relative', zIndex: 1000 }}>
          <View>
            <Text style={styles.heading}>Feedback</Text>
            <Text style={styles.subheading}>
              Teile uns dein Feedback in den vier Schritten der Gewaltfreien Kommunikation mit.
            </Text>

            <Text style={styles.label}>Art</Text>
            <SelectInline
              options={FEEDBACK_TYPE_OPTIONS}
              selectedValue={type}
              onValueChange={(v) => setType(v as FeedbackType)}
              placeholder="Art wählen"
              open={typeSelectOpen}
              onOpenChange={setTypeSelectOpen}
              triggerIcon={<MessageCirclePlus size={12} color={baseColors.black} />}
              disabled={submitting}
            />
          </View>
        </Pressable>

        <Pressable onPress={() => typeSelectOpen && setTypeSelectOpen(false)}>
          <View>
            <Text style={styles.stepLabel}>1. Was hast du beobachtet?</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={observation}
          onChangeText={setObservation}
          onFocus={() => typeSelectOpen && setTypeSelectOpen(false)}
          placeholder="Beschreibe die Situation ohne Bewertung …"
          placeholderTextColor="#999"
          multiline
          numberOfLines={3}
          maxLength={5000}
          textAlignVertical="top"
          editable={!submitting}
        />

        <Text style={styles.stepLabel}>2. Wie ging es dir damit? Wie hast du dich gefühlt?</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={feelings}
          onChangeText={setFeelings}
          onFocus={() => typeSelectOpen && setTypeSelectOpen(false)}
          placeholder="Deine Gefühle in dieser Situation …"
          placeholderTextColor="#999"
          multiline
          numberOfLines={3}
          maxLength={5000}
          textAlignVertical="top"
          editable={!submitting}
        />

        <Text style={styles.stepLabel}>3. Was hättest du gebraucht? Welches Bedürfnis?</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={needs}
          onChangeText={setNeeds}
          onFocus={() => typeSelectOpen && setTypeSelectOpen(false)}
          placeholder="Welches Bedürfnis war (nicht) erfüllt? …"
          placeholderTextColor="#999"
          multiline
          numberOfLines={3}
          maxLength={5000}
          textAlignVertical="top"
          editable={!submitting}
        />

        <Text style={styles.stepLabel}>4. Hast du eine Bitte an uns?</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={request}
          onChangeText={setRequest}
          onFocus={() => typeSelectOpen && setTypeSelectOpen(false)}
          placeholder="Eine konkrete, erfüllbare Bitte …"
          placeholderTextColor="#999"
          multiline
          numberOfLines={3}
          maxLength={5000}
          textAlignVertical="top"
          editable={!submitting}
        />

        {submitted && (
          <View style={styles.successBanner}>
            <Text style={styles.successText}>Vielen Dank! Dein Feedback wurde gesendet.</Text>
          </View>
        )}

<View className="flex-row justify-center">
        <TouchableOpacity
          style={styles.submitButtonContainer}
          onPress={handleSubmit}
          disabled={submitting}
        >
          <ImageBackground
            source={require('@/assets/images/Jungle.jpg')}
            resizeMode="cover"
            style={[styles.submitButton, submitting && styles.submitButtonDisabled, { width: '100%', height: '100%' }]}
          >
            {submitting ? (
              <ActivityIndicator color={baseColors.offwhite} />
            ) : (
              <>
                <Text style={styles.submitButtonText}>Absenden</Text>
                <Check size={16} color="#fff" style={styles.submitButtonIcon} />
              </>
            )}
          </ImageBackground>
        </TouchableOpacity>
        </View>
        </View>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: baseColors.offwhite,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: Platform.OS === 'web' ? 80 : 120,
    paddingBottom: 100,
    paddingHorizontal: 20,
  },
  heading: {
    fontSize: 24,
    fontWeight: '700',
    color: baseColors.black,
    marginBottom: 8,
  },
  subheading: {
    fontSize: 15,
    color: '#555',
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: baseColors.black,
    marginBottom: 8,
  },
  stepLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: baseColors.black,
    marginBottom: 8,
    marginTop: 4,
  },
  input: {
    backgroundColor: baseColors.white,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: baseColors.black,
    marginBottom: 20,
  },
  textArea: {
    minHeight: 120,
    paddingTop: 12,
  },
  successBanner: {
    backgroundColor: `${baseColors.emerald}22`,
    padding: 14,
    borderRadius: 12,
    marginBottom: 20,
  },
  successText: {
    fontSize: 15,
    color: baseColors.forest,
  },
  submitButtonContainer: {
    overflow: 'hidden',
  },
  submitButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 999,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: 14,
    color: baseColors.offwhite,
  },
  submitButtonIcon: {
    backgroundColor: baseColors.white + '44',
    padding: 3,
    borderRadius: 999,
  },
});
