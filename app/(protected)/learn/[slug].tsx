import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Markdown, { MarkdownIt } from 'react-native-markdown-display';

import baseColors from '@/baseColors.config';
import Header from '@/components/Header';
import LoadingIndicator from '@/components/LoadingIndicator';
import TabBar from '@/components/TabBar';
import LearnAIQuestion from '@/components/learn/LearnAIQuestion';
import LearnAudio from '@/components/learn/LearnAudio';
import LearnBodyMap from '@/components/learn/LearnBodyMap';
import LearnBreathe from '@/components/learn/LearnBreathe';
import LearnFeelingsDetective from '@/components/learn/LearnFeelingsDetective';
import LearnImage from '@/components/learn/LearnImage';
import LearnMultipleChoice from '@/components/learn/LearnMultipleChoice';
import LearnNavigation from '@/components/learn/LearnNavigation';
import LearnNeedsDetective from '@/components/learn/LearnNeedsDetective';
import LearnNeedsRubiksCube from '@/components/learn/LearnNeedsRubiksCube';
import LearnSortable from '@/components/learn/LearnSortable';
import LearnStepIndicator from '@/components/learn/LearnStepIndicator';
import LearnTask from '@/components/learn/LearnTask';
import LearnText from '@/components/learn/LearnText';
import LearnTimer from '@/components/learn/LearnTimer';
import LearnTitleCard from '@/components/learn/LearnTitleCard';
import LearningSummary from '@/components/learn/LearningSummary';
import { useAuthGuard } from '@/hooks/use-auth';
import {
  completeLearningSession,
  createLearningSession,
  getLatestLearningSession,
  getTopicBySlug,
  saveLearningSessionFeedback,
  saveLearningSessionResponse,
  updateLearningSessionPage,
  type LearningSession,
  type Topic
} from '@/lib/api/learn';

// Initialize MarkdownIt with HTML support enabled
const markdownItInstance = MarkdownIt({ html: true });

const COMPONENT_STEP_NAMES: Record<string, string> = {
  title: 'Start',
  summary: 'Zusammenfassung ✦',
  text: 'Text',
  heading: 'Überschrift',
  list: 'Liste',
  image: 'Bild',
  timer: 'Timer',
  task: 'Aufgabe',
  sortable: 'Sortieren',
  multipleChoice: 'Multiple Choice',
  breathe: 'Atmen',
  audio: 'Audio',
  aiQuestion: 'KI-Frage ✦',
  feelingsDetective: 'Gefühls-Detektiv ✦',
  bodymap: 'Körperkarte',
  needsDetective: 'Bedürfnis-Detektiv ✦',
  needsRubiksCube: 'Bedürfnis-Rubik ✦',
};

function getStepComponentName(stepData: { component: string } | null): string {
  if (!stepData) return '';
  return COMPONENT_STEP_NAMES[stepData.component] || stepData.component;
}

const SAVE_DEBOUNCE_MS = 800;

function LearnSortableWithDebouncedSave({
  content,
  color,
  session,
  currentStepData,
  topicVersion,
  handleNextStep,
  handlePrevStep,
  setSession,
}: {
  content: any;
  color: string;
  session: LearningSession | null;
  currentStepData: any;
  topicVersion: any;
  handleNextStep: () => void;
  handlePrevStep: () => void;
  setSession: (s: LearningSession | null | ((prev: LearningSession | null) => LearningSession | null)) => void;
}) {
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingResponseRef = useRef<any>(null);

  const flushSave = useCallback(async () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    const response = pendingResponseRef.current;
    if (response && session && currentStepData?.blockIndex >= 0) {
      try {
        const updatedSession = await saveLearningSessionResponse(
          session.id,
          currentStepData.blockIndex,
          'sortable',
          response,
          topicVersion.id,
          content,
          session
        );
        if (updatedSession) setSession(updatedSession);
      } catch {
        // Swallow - avoid flooding console when backend unreachable
      }
      pendingResponseRef.current = null;
    }
  }, [session, currentStepData, topicVersion, content, setSession]);

  const onResponse = useCallback(
    (response: any) => {
      pendingResponseRef.current = response;
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(flushSave, SAVE_DEBOUNCE_MS);
    },
    [flushSave]
  );

  useEffect(() => () => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    flushSave();
  }, [flushSave]);

  return (
    <LearnSortable
      content={content}
      color={color}
      initialUserSorting={
        session?.responses?.find(
          (r) =>
            r.blockIndex === currentStepData?.blockIndex &&
            r.blockType === 'sortable' &&
            JSON.stringify(r.blockContent) === JSON.stringify(content)
        )?.response?.userSorting
      }
      onResponse={onResponse}
      onNext={handleNextStep}
      onPrev={handlePrevStep}
    />
  );
}

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

  // Reset child navigation preference when step changes
  // This allows components with internal steps to set their navigation preference
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
        if (!user?.id) {
          throw new Error('Missing authenticated user');
        }

        let sessionData = await getLatestLearningSession(user.id, topicData.id);

        const content = topicData.expand?.currentVersion?.content || [];
        const getComponentStepCount = (component: any) => {
          if (component.type === 'aiQuestion') return 2;
          if (component.type === 'feelingsDetective') return 5;
          if (component.type === 'bodymap') return 2;
          if (component.type === 'needsDetective') return 4;
          if (component.type === 'needsRubiksCube') return 2;
          return 1;
        };
        const totalSteps =
          1 + content.reduce((sum, item) => sum + getComponentStepCount(item), 0) + 1;

        if (!sessionData || sessionData.topicVersionId !== topicData.expand.currentVersion.id) {
          sessionData = await createLearningSession(
            user.id,
            topicData.id,
            topicData.expand.currentVersion.id
          );
        } else if (!sessionData.completed) {
          const isAtSummary = (sessionData.currentPage ?? 0) >= totalSteps - 1;
          if (isAtSummary) {
            const completedSession = await completeLearningSession(sessionData.id);
            if (completedSession) {
              sessionData = completedSession;
            } else {
              sessionData = { ...sessionData, completed: true };
            }
          }
        }
        
        if (sessionData) {
          if (sessionData.completed) {
            setSession(sessionData);
            setCurrentStep(totalSteps - 1);
          } else {
            setSession(sessionData);
            setCurrentStep(sessionData.currentPage || 0);
          }
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
    
    // Must match getComponentStepCount used for totalStepsArray
    const getComponentStepCount = (component: any) => {
      if (component.type === 'aiQuestion') return 2;
      if (component.type === 'feelingsDetective') return 5;
      if (component.type === 'bodymap') return 2;
      if (component.type === 'needsDetective') return 4;
      if (component.type === 'needsRubiksCube') return 2;
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
        <LoadingIndicator />
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
  
  // Calculate step count: each aiQuestion takes 2 steps, feelingsDetective takes 5 steps, bodymap takes 2, needsDetective 4, needsRubiksCube 2, others take 1
  const getComponentStepCount = (component: any) => {
    if (component.type === 'aiQuestion') {
      return 2;
    }
    if (component.type === 'feelingsDetective') {
      return 5;
    }
    if (component.type === 'bodymap') {
      return 2;
    }
    if (component.type === 'needsDetective') {
      return 4;
    }
    if (component.type === 'needsRubiksCube') {
      return 2;
    }
    return 1;
  };

  // Build totalSteps array mapping step indices to component info
  // This matches the Svelte implementation structure
  const totalStepsArray: Array<{ component: string; internalStep: number; blockIndex: number }> = [];
  
  // Step 0: title (blockIndex: -1)
  totalStepsArray.push({ component: 'title', internalStep: 0, blockIndex: -1 });
  
  // Add content items with their blockIndex
  content.forEach((item: any, index: number) => {
    const stepCount = getComponentStepCount(item);
    for (let i = 0; i < stepCount; i++) {
      totalStepsArray.push({ 
        component: item.type || 'unknown', 
        internalStep: i,
        blockIndex: index // Store the index in the content array
      });
    }
  });
  
  // Final step: summary (blockIndex: -1)
  totalStepsArray.push({ component: 'summary', internalStep: 0, blockIndex: -1 });
  
  const totalSteps = totalStepsArray.length;
  const categoryColor = topicVersion.expand?.category?.color || baseColors.primary;

  // Get current content item using blockIndex from totalStepsArray (matches Svelte implementation)
  const currentStepData = totalStepsArray[currentStep];
  const currentContentItem = currentStepData?.blockIndex >= 0 
    ? content[currentStepData.blockIndex] 
    : null;
  
  // Determine if parent navigation should be shown
  // If child component has explicitly set visibility preference (via childWantsParentNavigation), use that
  // Otherwise, use default logic (show for steps that aren't first or last)
  // For components like aiQuestion and feelingsDetective, childWantsParentNavigation will be set to false
  // Also check component type - components with internal steps should not show parent navigation by default
  const componentHandlesOwnNavigation = currentStepData?.component === 'aiQuestion' ||
                                        currentStepData?.component === 'feelingsDetective' ||
                                        currentStepData?.component === 'bodymap' ||
                                        currentStepData?.component === 'needsDetective' ||
                                        currentStepData?.component === 'needsRubiksCube' ||
                                        currentStepData?.component === 'sortable' ||
                                        currentStepData?.component === 'multipleChoice';
  
  const showBottomNavigation = childWantsParentNavigation !== null
    ? childWantsParentNavigation
    : componentHandlesOwnNavigation 
      ? false // Don't show parent navigation for components that handle their own navigation
      : currentStep > 0 && currentStep <= totalSteps - 1; // Show navigation on summary page too
  
  const isAiQuestionStep = currentStepData?.component === 'aiQuestion';
  const isSortableStep = currentStepData?.component === 'sortable';
  const isNeedsRubiksCubeStep = currentStepData?.component === 'needsRubiksCube';
  const useFlexLayout = isAiQuestionStep || isSortableStep || isNeedsRubiksCubeStep;
  const contentPadding = {
    paddingTop: Platform.OS === 'ios' ? 50 : Platform.OS === 'android' ? 60 : 40,
    flexGrow: 1,
    paddingBottom: currentStep === totalSteps - 1 ? 200 : (showBottomNavigation ? 136 : 40),
  };

  const contentArea = (
    <View testID="learn-detail-content" className={`flex flex-1 flex-col min-h-0 px-4 pt-4 pb-6`} style={{ minHeight: 0 }}>
      <LearnStepIndicator
        currentStep={currentStep}
        totalSteps={totalSteps}
        color={categoryColor}
        inactiveColor={baseColors.white}
        stepName={getStepComponentName(currentStepData)}
      />

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
            // Summary/Completion - Use LearningSummary component
            topic ? (
              <LearningSummary
                session={session}
                topic={topic}
                color={categoryColor}
                onFeedbackSubmit={async (feedback) => {
                  if (session) {
                    const updatedSession = await saveLearningSessionFeedback(session.id, feedback);
                    if (updatedSession) {
                      setSession(updatedSession);
                    }
                  }
                }}
              />
            ) : (
              <View className="flex-1 items-center justify-center">
                <Text className="text-gray-600">Loading summary...</Text>
              </View>
            )
          ) : (
            // Content Steps
            <View className="flex flex-1 flex-col min-h-0" style={{ minHeight: 0 }}>
              {(() => {
                // Use currentContentItem which is correctly calculated using blockIndex
                // This properly handles multi-step components
                const contentItem = currentContentItem;

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
                  case 'image':
                    return (
                      <LearnImage
                        content={contentItem}
                        collectionId={topicVersion.collectionId}
                        recordId={topicVersion.id}
                      />
                    );
                  case 'timer':
                    return (
                      <LearnTimer
                        duration={contentItem.duration ?? 60}
                        color={categoryColor}
                        session={session}
                        onResponse={async (response) => {
                          if (session && currentStepData?.blockIndex >= 0) {
                            const updatedSession = await saveLearningSessionResponse(
                              session.id,
                              currentStepData.blockIndex,
                              'timer',
                              response,
                              topicVersion.id,
                              contentItem,
                              session
                            );
                            if (updatedSession) setSession(updatedSession);
                          }
                        }}
                      />
                    );
                  case 'task':
                    return (
                      <LearnTask
                        content={contentItem}
                        color={categoryColor}
                        onComplete={handleNextStep}
                      />
                    );
                  case 'sortable':
                    return (
                      <LearnSortableWithDebouncedSave
                        content={contentItem}
                        color={categoryColor}
                        session={session}
                        currentStepData={currentStepData}
                        topicVersion={topicVersion}
                        handleNextStep={handleNextStep}
                        handlePrevStep={handlePrevStep}
                        setSession={setSession}
                      />
                    );
                  case 'multipleChoice':
                    return (
                      <LearnMultipleChoice
                        content={contentItem}
                        color={categoryColor}
                        session={session}
                        contentBlock={contentItem}
                        topicVersionId={topicVersion.id}
                        onResponse={async (response) => {
                          if (session && currentStepData?.blockIndex >= 0) {
                            const updatedSession = await saveLearningSessionResponse(
                              session.id,
                              currentStepData.blockIndex,
                              'multipleChoice',
                              response,
                              topicVersion.id,
                              contentItem,
                              session
                            );
                            if (updatedSession) setSession(updatedSession);
                          }
                        }}
                        gotoNextStep={handleNextStep}
                        gotoPrevStep={handlePrevStep}
                      />
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
                          if (session && currentStepData?.blockIndex >= 0) {
                            const updatedSession = await saveLearningSessionResponse(
                              session.id,
                              currentStepData.blockIndex,
                              'audio',
                              response,
                              topicVersion.id,
                              contentItem,
                              session
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
                          if (session && currentStepData?.blockIndex >= 0) {
                            const updatedSession = await saveLearningSessionResponse(
                              session.id,
                              currentStepData.blockIndex,
                              'aiQuestion',
                              response,
                              topicVersion.id,
                              contentItem,
                              session
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
                  case 'feelingsDetective':
                    return (
                      <View
                        style={{
                          marginHorizontal: -16,
                          flex: 1,
                        }}
                      >
                        <LearnFeelingsDetective
                          content={contentItem}
                          color={categoryColor}
                          session={session}
                          contentBlock={contentItem}
                          currentStep={currentStep}
                          totalSteps={totalStepsArray}
                          topicVersionId={topicVersion.id}
                          onResponse={async (response) => {
                            if (session && currentStepData?.blockIndex >= 0) {
                              const updatedSession = await saveLearningSessionResponse(
                                session.id,
                                currentStepData.blockIndex,
                                'feelingsDetective',
                                response,
                                topicVersion.id,
                                contentItem,
                                session
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
                      </View>
                    );
                  case 'bodymap':
                    return (
                      <LearnBodyMap
                        content={contentItem}
                        color={categoryColor}
                        session={session}
                        contentBlock={contentItem}
                        currentStep={currentStep}
                        totalSteps={totalStepsArray}
                        onResponse={async (response) => {
                          if (session && currentStepData?.blockIndex >= 0) {
                            const updatedSession = await saveLearningSessionResponse(
                              session.id,
                              currentStepData.blockIndex,
                              'bodymap',
                              response,
                              topicVersion.id,
                              contentItem,
                              session
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
                  case 'needsDetective':
                    return (
                      <LearnNeedsDetective
                        content={contentItem}
                        color={categoryColor}
                        session={session}
                        contentBlock={contentItem}
                        currentStep={currentStep}
                        totalSteps={totalStepsArray}
                        topicVersionId={topicVersion.id}
                        onResponse={async (response) => {
                          if (session && currentStepData?.blockIndex >= 0) {
                            const updatedSession = await saveLearningSessionResponse(
                              session.id,
                              currentStepData.blockIndex,
                              'needsDetective',
                              response,
                              topicVersion.id,
                              contentItem,
                              session
                            );
                            if (updatedSession) setSession(updatedSession);
                          }
                        }}
                        gotoNextStep={handleNextStep}
                        gotoPrevStep={handlePrevStep}
                      />
                    );
                  case 'needsRubiksCube':
                    return (
                      <LearnNeedsRubiksCube
                        content={contentItem}
                        color={categoryColor}
                        session={session}
                        contentBlock={contentItem}
                        currentStep={currentStep}
                        totalSteps={totalStepsArray}
                        topicVersionId={topicVersion.id}
                        onResponse={async (response) => {
                          if (session && currentStepData?.blockIndex >= 0) {
                            const updatedSession = await saveLearningSessionResponse(
                              session.id,
                              currentStepData.blockIndex,
                              'needsRubiksCube',
                              response,
                              topicVersion.id,
                              contentItem,
                              session
                            );
                            if (updatedSession) setSession(updatedSession);
                          }
                        }}
                        gotoNextStep={handleNextStep}
                        gotoPrevStep={handlePrevStep}
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
  );

  return (
    <View className="flex-1" style={{ backgroundColor: baseColors.background }}>
      <Header />
      {useFlexLayout ? (
        <View className="flex-1" style={{ ...contentPadding, flex: 1, minHeight: 0 }}>
          {contentArea}
        </View>
      ) : (
        <ScrollView
          className="flex-1 flex-grow"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={contentPadding}
        >
          {contentArea}
        </ScrollView>
      )}
      {/* Fixed Bottom Navigation */}
      {showBottomNavigation && (
        <View 
          className="absolute left-0 right-0 px-4 py-4"
          style={{ 
            bottom: 70, // Position above TabBar
            backgroundColor: baseColors.background,
            borderTopWidth: 1,
            borderTopColor: 'rgba(0,0,0,0.1)',
            zIndex: 100,
            elevation: 100,
          }}
        >
          {currentStep === totalSteps - 1 ? (
            // Summary page navigation - back button + "Zurück zur Lernübersicht"
            <LearnNavigation
              onNext={async () => {
                await handleNextStep();
                router.push('/learn');
              }}
              onPrev={handlePrevStep}
              nextText="Zurück zur Lernübersicht"
              showPrev={true}
            />
          ) : (
            <LearnNavigation
              onNext={handleNextStep}
              onPrev={currentStep > 0 ? handlePrevStep : undefined}
              nextText={currentContentItem?.type === 'breathe' ? 'Überspringen' : (currentContentItem?.ctaText || (currentStep === totalSteps - 2 ? 'Abschließen' : 'Weiter'))}
              showPrev={currentStep > 0}
              variant={currentContentItem?.type === 'breathe' ? 'light' : 'default'}
            />
          )}
        </View>
      )}
      
      {/* TabBar */}
      <TabBar />
    </View>
  );
}

