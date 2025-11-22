import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Markdown, { MarkdownIt } from 'react-native-markdown-display';

import baseColors from '@/baseColors.config';
import Header from '@/components/Header';
import TabBar from '@/components/TabBar';
import LearnAIQuestion from '@/components/learn/LearnAIQuestion';
import LearnAudio from '@/components/learn/LearnAudio';
import LearnBreathe from '@/components/learn/LearnBreathe';
import LearnFeelingsDetective from '@/components/learn/LearnFeelingsDetective';
import LearnNavigation from '@/components/learn/LearnNavigation';
import LearnText from '@/components/learn/LearnText';
import LearnTitleCard from '@/components/learn/LearnTitleCard';
import { useAuthGuard } from '@/hooks/use-auth';
import {
  completeLearningSession,
  getOrCreateLearningSession,
  getTopicBySlug,
  saveLearningSessionResponse,
  updateLearningSessionPage,
  type LearningSession,
  type Topic,
} from '@/lib/api/learn';

// Initialize MarkdownIt with HTML support enabled
const markdownItInstance = MarkdownIt({ html: true });

export default function LearnDetailScreen() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuthGuard();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();

  const [topic, setTopic] = useState<Topic | null>(null);
  const [session, setSession] = useState<LearningSession | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [childWantsParentNavigation, setChildWantsParentNavigation] = useState<boolean | null>(null);

  useEffect(() => {
    if (isAuthenticated && user && slug) {
      loadTopic();
    }
  }, [isAuthenticated, user, slug]);

  // Reset child navigation preference when step changes (so new component can set it)
  useEffect(() => {
    setChildWantsParentNavigation(null);
  }, [currentStep]);

  const loadTopic = async () => {
    if (!slug || !user) return;

    setIsLoading(true);
    setError(null);
    try {
      const topicData = await getTopicBySlug(slug);
      setTopic(topicData);

      // Get or create learning session using backend API
      if (topicData.expand?.currentVersion?.id) {
        const sessionData = await getOrCreateLearningSession(
          topicData.id,
          topicData.expand.currentVersion.id
        );
        
        if (sessionData) {
          setSession(sessionData);
          setCurrentStep(sessionData.currentPage || 0);
        } else {
          // No session available - app works in read-only mode
          // User can still view content but progress won't be saved
          console.log('Learning session not available - continuing in read-only mode');
        }
      }
    } catch (err) {
      console.error('Error loading topic:', err);
      setError('Fehler beim Laden des Moduls');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNextStep = async () => {
    if (!topic?.expand?.currentVersion) return;

    const content = topic.expand.currentVersion.content || [];
    
    // Calculate step count: each aiQuestion takes 2 steps, others take 1
    const getComponentStepCount = (component: any) => {
      if (component.type === 'aiQuestion') {
        return 2;
      }
      return 1;
    };
    
    // Calculate total steps
    const totalSteps = 1 + // title
      content.reduce((sum, item) => sum + getComponentStepCount(item), 0) +
      1; // summary

    if (currentStep < totalSteps - 1) {
      const newStep = currentStep + 1;
      setCurrentStep(newStep);
      
      // Try to update session if available
      if (session) {
        const updatedSession = await updateLearningSessionPage(session.id, newStep);
        if (updatedSession) {
          setSession(updatedSession);
        }
      }
    } else {
      // Mark as completed
      if (session) {
        const completedSession = await completeLearningSession(session.id);
        if (completedSession) {
          setSession({ ...completedSession, completed: true });
        } else {
          // Update local state even if save failed
          setSession({ ...session, completed: true });
        }
      }
    }
  };

  const handlePrevStep = async () => {
    if (currentStep === 0) return;

    const newStep = currentStep - 1;
    setCurrentStep(newStep);
    
    // Try to update session if available
    if (session) {
      const updatedSession = await updateLearningSessionPage(session.id, newStep);
      if (updatedSession) {
        setSession(updatedSession);
      }
    }
  };

  if (authLoading || isLoading) {
    return (
      <View className="flex-1 justify-center items-center" style={{ backgroundColor: baseColors.background }}>
        <ActivityIndicator size="large" color={baseColors.primary} />
        <Text className="text-gray-600 mt-4">Loading...</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (error) {
    return (
      <View className="flex-1" style={{ backgroundColor: baseColors.background }}>
        <Header />
        <View className="flex-1 justify-center items-center px-4">
          <Text className="text-red-600 text-center mb-4">{error}</Text>
          <TouchableOpacity
            onPress={loadTopic}
            className="px-6 py-3 rounded-lg"
            style={{ backgroundColor: baseColors.primary }}
          >
            <Text className="text-white font-semibold">Erneut versuchen</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!topic || !topic.expand?.currentVersion) {
    return (
      <View className="flex-1" style={{ backgroundColor: baseColors.background }}>
        <Header />
        <View className="flex-1 justify-center items-center">
          <Text className="text-gray-600">Modul nicht gefunden</Text>
        </View>
      </View>
    );
  }

  const topicVersion = topic.expand.currentVersion;
  const content = topicVersion.content || [];
  
  // Calculate step count: each aiQuestion takes 2 steps, feelingsDetective takes 5 steps, others take 1
  const getComponentStepCount = (component: any) => {
    if (component.type === 'aiQuestion') {
      return 2;
    }
    if (component.type === 'feelingsDetective') {
      return 5;
    }
    return 1;
  };

  // Build totalSteps array mapping step indices to component info
  const totalStepsArray: Array<{ component: string; internalStep: number }> = [];
  totalStepsArray.push({ component: 'title', internalStep: 0 }); // Step 0: title
  
  let stepIndex = 1;
  content.forEach((item: any) => {
    const stepCount = getComponentStepCount(item);
    for (let i = 0; i < stepCount; i++) {
      totalStepsArray.push({ component: item.type || 'unknown', internalStep: i });
    }
  });
  
  totalStepsArray.push({ component: 'summary', internalStep: 0 }); // Final step: summary
  
  const totalSteps = totalStepsArray.length;
  const categoryColor = topicVersion.expand?.category?.color || baseColors.primary;

  // Get current content item for navigation buttons
  // Find which content item corresponds to current step
  let contentIndex = -1;
  let stepOffset = 1; // Start after title step
  for (let i = 0; i < content.length; i++) {
    const stepCount = getComponentStepCount(content[i]);
    if (currentStep >= stepOffset && currentStep < stepOffset + stepCount) {
      contentIndex = i;
      break;
    }
    stepOffset += stepCount;
  }
  
  const currentContentItem = contentIndex >= 0 ? content[contentIndex] : null;
  const currentStepData = totalStepsArray[currentStep];
  
  // Determine if parent navigation should be shown
  // If child component has explicitly set visibility preference, use that
  // Otherwise, use default logic (show for steps that aren't first or last)
  const showBottomNavigation = childWantsParentNavigation !== null
    ? childWantsParentNavigation
    : currentStep > 0 && currentStep < totalSteps - 1;
  
  console.log('currentContentItem type:', currentContentItem?.type);
  console.log('================================');

  return (
    <View className="flex flex-grow" style={{ backgroundColor: baseColors.background }}>
      <Header />
      <ScrollView 
        className="flex flex-grow" 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: Platform.OS === 'ios' ? 50 : Platform.OS === 'android' ? 60 : 40,
          paddingBottom: showBottomNavigation ? 136 : 40, // Extra padding for TabBar + navigation buttons
        }}
      >
        <View className="flex flex-col flex-grow px-4 pt-4 pb-6">
          {/* Step Indicator */}
          <View className="mb-4 flex items-center justify-center">
            <View className="flex-row items-center justify-center gap-0.5 rounded-full bg-neutral-500/5 p-1 shadow-inner w-3/4">
              {Array.from({ length: totalSteps }, (_, index) => index).map((stepIndex) => (
                <View
                  key={stepIndex}
                  className="h-2 flex-grow rounded-md"
                  style={{
                    backgroundColor: currentStep >= stepIndex 
                      ? categoryColor 
                      : 'rgba(255,255,255,0.8)',
                    opacity: stepIndex >= totalSteps ? 0.8 : 1,
                  }}
                />
              ))}
            </View>
          </View>

          {/* Content */}
          {currentStep === 0 ? (
            // Title Card
            <LearnTitleCard
              title={topicVersion.titleDE || ''}
              categoryColor={categoryColor}
              image={topicVersion.image}
              collectionId={topicVersion.collectionId}
              recordId={topicVersion.id}
              onStart={handleNextStep}
            />
          ) : currentStep === totalSteps - 1 ? (
            // Summary/Completion
            <View className="mb-6 flex flex-1 flex-col">
              <View className="flex-grow flex flex-col justify-center">
                <View className="bg-white rounded-lg p-6 mb-4">
                  <Text className="text-2xl font-bold mb-4">Modul abgeschlossen!</Text>
                  <Text className="text-gray-700 mb-4">
                    Du hast dieses Modul erfolgreich durchgearbeitet. Gut gemacht!
                  </Text>
                  {session?.completed && (
                    <View className="bg-teal-50 rounded-lg p-4 mb-4">
                      <Text className="text-teal-800 font-semibold">✓ Abgeschlossen</Text>
                    </View>
                  )}
                </View>
              </View>
              <LearnNavigation
                onNext={() => router.back()}
                nextText="Zurück zur Übersicht"
                showPrev={false}
              />
            </View>
          ) : (
            // Content Steps
            <View className="flex flex-col flex-grow">
              {(() => {
                const contentIndex = currentStep - 1;
                const contentItem = content[contentIndex];

                if (!contentItem) {
                  return (
                    <View className="flex-1 bg-white rounded-lg p-6">
                      <Text className="text-gray-600">Inhalt wird geladen...</Text>
                    </View>
                  );
                }

                // Render different content types
                switch (contentItem.type) {
                  case 'text':
                    return (
                      <LearnText content={contentItem.text || contentItem.content || ''} />
                    );
                  case 'heading':
                    const hierarchy = contentItem.hierarchy || 1;
                    const headingStyles: Record<number, { size: string; marginTop: number; marginBottom: number }> = {
                      1: { size: 'text-xl', marginTop: 10, marginBottom: 6 },
                      2: { size: 'text-lg', marginTop: 8, marginBottom: 4 },
                      3: { size: 'text-base', marginTop: 6, marginBottom: 3 },
                      4: { size: 'text-sm', marginTop: 5, marginBottom: 2 },
                      5: { size: 'text-xs', marginTop: 4, marginBottom: 2 },
                      6: { size: 'text-xs', marginTop: 3, marginBottom: 1 },
                    };
                    const style = headingStyles[hierarchy] || headingStyles[1];
                    return (
                      <View className="mb-6" style={{ marginTop: style.marginTop, marginBottom: style.marginBottom }}>
                        <Text className={`${style.size} font-bold text-gray-900`}>
                          {contentItem.content || contentItem.text || contentItem.heading}
                        </Text>
                        {contentItem.subheading && (
                          <Text className={`mt-2 ${style.size === 'text-xl' ? 'text-lg' : style.size === 'text-lg' ? 'text-base' : 'text-sm'} text-gray-600`}>
                            {contentItem.subheading}
                          </Text>
                        )}
                      </View>
                    );
                  case 'list':
                    return (
                      <View className="flex flex-1 flex-col justify-between gap-2 mb-6 relative z-0">
                        <View className="flex-grow flex flex-col justify-center gap-2">
                          {contentItem.items?.map((item: any, index: number) => (
                            <View key={index} className="flex flex-col gap-2 rounded-xl bg-white/80 border border-white shadow-lg p-3 relative z-10" style={{ shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2 }}>
                              <View className="flex-row gap-3 items-center">
                                <View
                                  className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full"
                                  style={{ backgroundColor: categoryColor }}
                                >
                                  <Text className="text-[10px] font-bold text-white">{index + 1}</Text>
                                </View>
                                {item.title && (
                                  <View className="flex-1">
                                    <Markdown
                                      markdownit={markdownItInstance}
                                      style={{
                                        body: {
                                          fontSize: 15,
                                          fontWeight: 'bold',
                                          color: '#111827',
                                          lineHeight: 20,
                                        },
                                        paragraph: {
                                          marginBottom: 0,
                                        },
                                        strong: {
                                          fontWeight: 'bold',
                                        },
                                      }}
                                      rules={{
                                        br: (node, children, parent, styles) => (
                                          <Text key={node.key}>{'\n'}</Text>
                                        ),
                                      }}
                                    >
                                      {item.title}
                                    </Markdown>
                                  </View>
                                )}
                              </View>
                              {item.text && (
                                <View className="pl-7 pr-1">
                                  <Markdown
                                    markdownit={markdownItInstance}
                                    style={{
                                      body: {
                                        fontSize: 16,
                                        color: '#1f2937',
                                        lineHeight: 20,
                                      },
                                      paragraph: {
                                        marginBottom: 8,
                                      },
                                      strong: {
                                        fontWeight: 'bold',
                                      },
                                      em: {
                                        fontStyle: 'italic',
                                      },
                                      link: {
                                        color: '#0f766e',
                                        textDecorationLine: 'underline',
                                      },
                                    }}
                                    rules={{
                                      br: (node, children, parent, styles) => (
                                        <Text key={node.key}>{'\n'}</Text>
                                      ),
                                    }}
                                  >
                                    {item.text}
                                  </Markdown>
                                </View>
                              )}
                            </View>
                          ))}
                        </View>
                      </View>
                    );
                  case 'breathe':
                    return (
                      <LearnBreathe
                        content={contentItem}
                        onNext={handleNextStep}
                        onPrev={handlePrevStep}
                      />
                    );
                  case 'audio':
                    return (
                      <LearnAudio
                        content={contentItem}
                        color={categoryColor}
                        session={session}
                        onResponse={async (response) => {
                          if (session) {
                            const updatedSession = await saveLearningSessionResponse(
                              session.id,
                              contentIndex,
                              'audio',
                              response,
                              topicVersion.id,
                              contentItem
                            );
                            if (updatedSession) {
                              setSession(updatedSession);
                            }
                          }
                        }}
                      />
                    );
                  case 'aiQuestion':
                    return (
                      <LearnAIQuestion
                        content={contentItem}
                        color={categoryColor}
                        session={session}
                        contentBlock={contentItem}
                        currentStep={currentStep}
                        totalSteps={totalStepsArray}
                        topicVersionId={topicVersion.id}
                        onResponse={async (response) => {
                          if (session) {
                            const updatedSession = await saveLearningSessionResponse(
                              session.id,
                              contentIndex,
                              'aiQuestion',
                              response,
                              topicVersion.id,
                              contentItem
                            );
                            if (updatedSession) {
                              setSession(updatedSession);
                            }
                          }
                        }}
                        gotoNextStep={handleNextStep}
                        gotoPrevStep={handlePrevStep}
                      />
                    );
                  case 'feelingsDetective':
                    return (
                      <LearnFeelingsDetective
                        content={contentItem}
                        color={categoryColor}
                        session={session}
                        contentBlock={contentItem}
                        currentStep={currentStep}
                        totalSteps={totalStepsArray}
                        topicVersionId={topicVersion.id}
                        onResponse={async (response) => {
                          if (session) {
                            const updatedSession = await saveLearningSessionResponse(
                              session.id,
                              contentIndex,
                              'feelingsDetective',
                              response,
                              topicVersion.id,
                              contentItem
                            );
                            if (updatedSession) {
                              setSession(updatedSession);
                            }
                          }
                        }}
                        gotoNextStep={handleNextStep}
                        gotoPrevStep={handlePrevStep}
                        onParentNavigationVisibilityChange={setChildWantsParentNavigation}
                      />
                    );
                  default:
                    return (
                      <View className="bg-white rounded-lg p-6 mb-4">
                        <Text className="text-gray-600">
                          Komponententyp "{contentItem.type}" wird noch nicht unterstützt.
                        </Text>
                      </View>
                    );
                }
              })()}
            </View>
          )}
        </View>
      </ScrollView>
      
      {/* Fixed Bottom Navigation */}
      {showBottomNavigation && (
        <View 
          className="absolute left-0 right-0 px-4 py-4"
          style={{ 
            bottom: 70, // Position above TabBar
            backgroundColor: baseColors.background,
            borderTopWidth: 1,
            borderTopColor: 'rgba(0,0,0,0.1)',
          }}
        >
          <LearnNavigation
            onNext={handleNextStep}
            onPrev={currentStep > 0 ? handlePrevStep : undefined}
            nextText={currentContentItem?.type === 'breathe' ? 'Überspringen' : (currentContentItem?.ctaText || (currentStep === totalSteps - 2 ? 'Abschließen' : 'Weiter'))}
            showPrev={currentStep > 0}
            variant={currentContentItem?.type === 'breathe' ? 'light' : 'default'}
          />
        </View>
      )}
      
      {/* TabBar */}
      <TabBar />
    </View>
  );
}

