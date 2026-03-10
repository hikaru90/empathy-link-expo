import jungleImage from '@/assets/images/Jungle.jpg';
import baseColors from '@/baseColors.config';
import ImageIconButton from '@/components/ImageIconButton';
import LearnStepIndicator from '@/components/learn/LearnStepIndicator';
import { ONBOARDING_STEPS } from '@/constants/onboarding';
import { getChatSettings, updateChatSettings } from '@/lib/api/chat';
import { CoveredByYourGrace_400Regular } from '@expo-google-fonts/covered-by-your-grace/400Regular';
import { useFonts } from '@expo-google-fonts/covered-by-your-grace/useFonts';
import { Image } from 'expo-image';
import { ArrowLeft, ArrowRight, RedoDot } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  Platform,
  ScrollView,
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
    if (visible) {
      setCurrentStep(0);
      setSelectedGoal('');
    }
  }, [visible]);

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
        <View style={{
          flex: 1,
          backgroundColor: baseColors.background,
          paddingHorizontal: 24,
          paddingTop: Platform.OS === 'ios' ? 60 : Platform.OS === 'android' ? 44 : 24,
          paddingBottom: Platform.OS === 'ios' ? 40 : 24,
        }}>
          <View style={{ flex: 1 }}>
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
                    <Text style={{ fontSize: 16, lineHeight: 24, color: baseColors.black, opacity: 0.9 }}>{step.content}</Text>
                  )}
                </ScrollView>

                {/* Buttons */}
                <View style={{ paddingTop: 16 }}>
                  <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                    <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 8, paddingLeft: 16, paddingRight: 8, borderRadius: 999, backgroundColor: baseColors.white, flexShrink: 0 }} onPress={skipOnboarding}>
                      <Text style={{ fontSize: 14, fontWeight: '500', color: baseColors.black }}>Überspringen</Text>

                      <RedoDot size={16} color="#000" style={{ backgroundColor: baseColors.white + '44', padding: 3, borderRadius: 999 }} />
                    </TouchableOpacity>
                    {!isFirstStep && (
                      <TouchableOpacity style={{ width: 32, height: 32, borderRadius: 22, backgroundColor: baseColors.white, alignItems: 'center', justifyContent: 'center' }} onPress={prevStep}>
                        <ArrowLeft size={16} color={baseColors.black} />
                      </TouchableOpacity>
                    )}
                    <ImageIconButton
                      onPress={nextStep}
                      image={jungleImage}
                      icon={<ArrowRight color="#fff" />}
                      label={isLastStep ? "Los geht's" : 'Weiter'}
                      size="medium"
                      style={{ flex: 1 }}
                    />
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
