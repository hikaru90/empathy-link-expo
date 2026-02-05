import jungleImage from '@/assets/images/Jungle.jpg';
import baseColors from '@/baseColors.config';
import LearnStepIndicator from '@/components/learn/LearnStepIndicator';
import { ONBOARDING_STEPS } from '@/constants/onboarding';
import { getChatSettings, updateChatSettings } from '@/lib/api/chat';
import { CoveredByYourGrace_400Regular } from '@expo-google-fonts/covered-by-your-grace/400Regular';
import { useFonts } from '@expo-google-fonts/covered-by-your-grace/useFonts';
import { Image } from 'expo-image';
import { ArrowLeft, ArrowRight } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  ImageBackground,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import UserGoal from './UserGoal';

interface OnboardingWelcomeProps {
  visible: boolean;
  onComplete: () => void;
}

export default function OnboardingWelcome({ visible, onComplete }: OnboardingWelcomeProps) {

  let [fontsLoaded] = useFonts({
    CoveredByYourGrace_400Regular
  });


  const [currentStep, setCurrentStep] = useState(0);
  const [selectedGoal, setSelectedGoal] = useState('');
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const step = ONBOARDING_STEPS[currentStep];

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [currentStep, fadeAnim]);
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;
  const isFirstStep = currentStep === 0;

  async function nextStep() {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      await runStepTransition(() => setCurrentStep((s) => s + 1));
    } else {
      await saveUserGoalAndComplete();
    }
  }

  async function prevStep() {
    if (currentStep > 0) {
      await runStepTransition(() => setCurrentStep((s) => s - 1));
    }
  }

  async function runStepTransition(updateStep: () => void) {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        updateStep();
      }
    });
  }

  async function saveUserGoalAndComplete() {
    if (selectedGoal) {
      try {
        const current = await getChatSettings().catch(() => ({
          aiAnswerLength: 'short' as const,
          toneOfVoice: 'heartfelt' as const,
          nvcKnowledge: 'beginner' as const,
        }));
        await updateChatSettings({ ...current, userGoal: selectedGoal });
      } catch (e) {
        console.warn('Failed to save user goal:', e);
      }
    }
    onComplete();
  }

  async function skipOnboarding() {
    await saveUserGoalAndComplete();
  }

  if (!fontsLoaded) {
    return null
  } else {
    return (
      <Modal visible={visible} animationType="fade" transparent>
        <View style={styles.overlay}>
          <View style={{
            flex: 1,
          }}>
            <View className="flex justify-center items-center">
              <View style={{ maxWidth: 140, width: '100%' }}>
                <LearnStepIndicator
                  currentStep={currentStep}
                  totalSteps={ONBOARDING_STEPS.length}
                  color={baseColors.forest}
                  inactiveColor={baseColors.white}
                />
              </View>
            </View>

            <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
              <View className="flex items-center justify-center text-center w-full mt-4">
                <Text style={{
                  fontSize: 40,
                  lineHeight: 42,
                  color: baseColors.purple,
                  marginBottom: 16,
                  textAlign: 'center',
                  fontFamily: "CoveredByYourGrace_400Regular"
                }}>{step.title}</Text>
              </View>

              {/* Illustration */}
              <View style={{
                flex: 1,
                flexGrow: 1,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Image
                  source={step.image}
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: [{ translateX: '-50%' }, { translateY: '-50%' }],
                    height: '100%',
                    maxWidth: 200,
                    maxHeight: 200,
                    aspectRatio: 1,
                    resizeMode: 'contain',
                  }}
                  contentFit="contain"
                />
              </View>

              <View>
                {/* Content */}
                <ScrollView
                  contentContainerStyle={{
                    paddingBottom: 8,
                  }}
                  showsVerticalScrollIndicator={false}
                >
                  {step.component === 'userGoal' ? (
                    <UserGoal selectedGoal={selectedGoal} onSelectGoal={setSelectedGoal} />
                  ) : (
                    <Text style={styles.content}>{step.content}</Text>
                  )}
                </ScrollView>

              {/* Buttons */}
              <View style={styles.buttons}>
                <View style={styles.buttonRow}>
                  <TouchableOpacity style={styles.skipButton} onPress={skipOnboarding}>
                    <Text style={styles.skipText}>Überspringen</Text>
                    <ArrowRight size={16} color="#000" style={{ backgroundColor: baseColors.white + '44', padding: 3, borderRadius: 999 }} />
                  </TouchableOpacity>
                  {!isFirstStep && (
                    <TouchableOpacity style={styles.backButton} onPress={prevStep}>
                      <ArrowLeft size={16} color={baseColors.black} />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={styles.nextButton} onPress={nextStep}>
                    <ImageBackground
                      source={jungleImage}
                      resizeMode="cover"
                      style={styles.nextButtonBackground}
                    >
                      <Text style={styles.nextText}>{isLastStep ? "Los geht's" : 'Weiter'}</Text>
                      <ArrowRight size={16} color="#fff" style={{ backgroundColor: baseColors.white + '44', padding: 3, borderRadius: 999 }} />
                    </ImageBackground>
                  </TouchableOpacity>
                </View>
              </View>
              </View>
            </Animated.View>
          </View>
        </View>
      </Modal>
    );
  }
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: baseColors.background,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : Platform.OS === 'android' ? 44 : 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  content: {
    fontSize: 16,
    lineHeight: 24,
    color: baseColors.black,
    opacity: 0.9,
  },
  buttons: {
    paddingTop: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  skipText: {
    fontSize: 14,
    fontWeight: '500',
    color: baseColors.black,
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 22,
    backgroundColor: baseColors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButton: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  skipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingLeft: 16,
    paddingRight: 8,
    borderRadius: 999,
    backgroundColor: baseColors.white,
    flexShrink: 0,
  },
  nextButtonBackground: {
    width: '100%',
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    gap: 16,
    paddingLeft: 16,
    paddingRight: 8,
  },
  nextText: {
    fontSize: 14,
    fontWeight: '600',
    color: baseColors.offwhite,
  },
});
