import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { BadgeCheck, Play } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  Image,
  Modal,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';

import baseColors from '@/baseColors.config';
import GradientImage from '@/components/GradientImage';
import Header from '@/components/Header';
import DonutChart from '@/components/stats/DonutChart';
import { useAuthGuard } from '@/hooks/use-auth';
import {
  createLearningSession,
  getCategories,
  getCompletionStatus,
  getLatestLearningSession,
  getPocketBaseFileUrl,
  getTopics,
  type Topic,
  type TopicCategory,
} from '@/lib/api/learn';

interface GroupedCategory {
  category: TopicCategory;
  topics: Topic[];
  completion: {
    completed: number;
    total: number;
    percentage: number;
  };
}

export default function LearnScreen() {
  const { isAuthenticated, isLoading, user } = useAuthGuard();
  const router = useRouter();
  const [categories, setCategories] = useState<TopicCategory[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [completionStatus, setCompletionStatus] = useState<Record<string, boolean>>({});
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [topicActionInProgress, setTopicActionInProgress] = useState<string | null>(null);
  const [isRestartingTopic, setIsRestartingTopic] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      loadData();
    }
  }, [isAuthenticated, user]);

  const loadData = async () => {
    setIsLoadingData(true);
    setError(null);
    try {
      const [categoriesData, topicsData, completionData] = await Promise.all([
        getCategories(),
        getTopics(),
        getCompletionStatus(),
      ]);
      setCategories(categoriesData);
      setTopics(topicsData);
      setCompletionStatus(completionData);
    } catch (err) {
      console.error('Error loading learn data:', err);
      setError('Fehler beim Laden der Lernmodule');
    } finally {
      setIsLoadingData(false);
    }
  };

  // Group topics by category
  const groupedCategories: GroupedCategory[] = categories
    .map((category) => {
      const categoryTopics = topics.filter(
        (topic) => topic.expand?.currentVersion?.expand?.category?.id === category.id
      );
      const completed = categoryTopics.filter((topic) => completionStatus[topic.id]).length;
      const total = categoryTopics.length;
      const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

      return {
        category,
        topics: categoryTopics.sort((a, b) => (a.order || 0) - (b.order || 0)),
        completion: {
          completed,
          total,
          percentage,
        },
      };
    })
    .filter((group) => group.topics.length > 0)
    .sort((a, b) => (a.category.order || 0) - (b.category.order || 0));

  // Calculate overall completion stats
  const overallCompletion = {
    completed: topics.filter((topic) => completionStatus[topic.id]).length,
    total: topics.length,
    percentage:
      topics.length > 0
        ? Math.round(
          (topics.filter((topic) => completionStatus[topic.id]).length / topics.length) * 100
        )
        : 0,
  };

  const closeRestartModal = () => {
    setShowRestartConfirm(false);
    setSelectedTopic(null);
  };

  const navigateToTopic = (topic: Topic) => {
    router.push(`/(protected)/learn/${topic.slug}` as any);
  };

  const startFreshSession = async (topic: Topic) => {
    if (!user?.id || !topic.expand?.currentVersion?.id) {
      console.warn('Cannot create session without user or topic version.');
      return;
    }

    const newSession = await createLearningSession(
      user.id,
      topic.id,
      topic.expand.currentVersion.id
    );

    if (newSession) {
      closeRestartModal();
      navigateToTopic(topic);
    } else {
      console.error('Failed to create a new learning session.');
    }
  };

  const handleTopicPress = async (topic: Topic) => {
    if (!user?.id || !topic.expand?.currentVersion?.id) {
      console.warn('Missing user or topic version, navigating directly.');
      navigateToTopic(topic);
      return;
    }

    if (topicActionInProgress) {
      return;
    }

    setTopicActionInProgress(topic.id);
    try {
      const existingSession = await getLatestLearningSession(user.id, topic.id);

      if (!existingSession) {
        await startFreshSession(topic);
        return;
      }

      if (existingSession.completed) {
        setSelectedTopic(topic);
        setShowRestartConfirm(true);
        return;
      }

      navigateToTopic(topic);
    } catch (err) {
      console.error('Failed to open learning session:', err);
    } finally {
      setTopicActionInProgress(null);
    }
  };

  const isTopicCompleted = (topicId: string) => completionStatus[topicId] || false;

  if (isLoading) {
    return (
      <View className="flex-1" style={{ backgroundColor: baseColors.background }}>
        <View className="flex-1 justify-center items-center -mt-6">
          <GradientImage style={{ width: 40, height: 20, borderRadius: 16 }} fast />
          <Text className="text-gray-600 mt-2">Laden</Text>
        </View>
      </View>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to auth
  }

  if (isLoadingData) {
    return (
      <View className="flex-1" style={{ backgroundColor: baseColors.background }}>
        <Header />
        <View className="flex-1 justify-center items-center">
          <GradientImage style={{ width: 80, height: 32, borderRadius: 16 }} fast />
          <Text className="text-gray-600 mt-4">Lade Lernmodule...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1" style={{ backgroundColor: baseColors.background }}>
        <Header />
        <View className="flex-1 justify-center items-center px-4">
          <Text className="text-red-600 text-center mb-4">{error}</Text>
          <TouchableOpacity
            onPress={loadData}
            className="px-6 py-3 rounded-lg"
            style={{ backgroundColor: baseColors.primary }}
          >
            <Text className="text-white font-semibold">Erneut versuchen</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const donutData = [
    {
      value: 'completed',
      count: overallCompletion.completed,
    },
    {
      value: 'remaining',
      count: Math.max(0, overallCompletion.total - overallCompletion.completed),
    },
  ].filter((item) => item.count > 0);
  const donutColors = ['#0f766e', '#e5e7eb'];

  return (
    <View className="flex-1" style={{ backgroundColor: baseColors.background }}>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: Platform.OS === 'ios' ? 50 : Platform.OS === 'android' ? 60 : 40,
        }}
      >
        <View className="px-4 pt-4 pb-6">
          <Text className="text-2xl font-light mb-3 max-w-[15em]">
            Stärke deine Empathiefähigkeit, Schritt für Schritt.
          </Text>
          <Text className="text-2xl font-light text-black/40 mb-6 max-w-[14em]">
            Lerne praktische Werkzeuge, um klar, mitfühlend und selbstbewusst zu kommunizieren.
          </Text>

          {/* Progress Summary */}
          {overallCompletion.total > 0 && (
            <View className="mb-8 rounded-xl bg-white/80 border border-white/20 px-4 py-5 shadow-lg" style={{ shadowColor: '#065f46', shadowOpacity: 0.05 }}>
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-3">
                  {donutData.length > 0 ? (
                    <View style={{ width: 64, height: 64 }}>
                      <DonutChart 
                        data={donutData} 
                        colors={donutColors} 
                        size={64}
                        showPercentage={true}
                        completedCount={overallCompletion.completed}
                        totalCount={overallCompletion.total}
                      />
                    </View>
                  ) : (
                    <View className="w-16 h-16 rounded-full bg-gray-200 items-center justify-center">
                      <Text className="text-xs text-gray-600">0%</Text>
                    </View>
                  )}
                  <View className="flex-col">
                    <Text className="text-lg font-bold leading-tight">Dein Fortschritt</Text>
                    <Text className="text-xs text-black/50">
                      {overallCompletion.completed} von {overallCompletion.total} Modulen abgeschlossen
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Categories and Topics */}
          {groupedCategories.length === 0 ? (
            <View className="flex h-64 w-full items-center justify-center">
              <Text className="text-gray-600">Keine Lernmodule verfügbar</Text>
            </View>
          ) : (
            <View className="flex-col gap-4 mb-20">
              {groupedCategories.map((group) => (
                <View key={group.category.id} className="mb-4">
                  <View className="mb-2">
                    <Text className="text-xl font-bold">{group.category.nameDE}</Text>
                    {group.completion.total > 0 && (
                      <View className="flex-row items-center gap-2 mt-2">
                        {group.completion.completed === group.completion.total ? (
                          <View className="flex-row items-center gap-1 rounded-full bg-teal-500/30 px-3 py-1">
                            <BadgeCheck size={16} color="#0f766e" />
                            <Text className="text-xs font-medium text-teal-700">Abgeschlossen</Text>
                          </View>
                        ) : (
                          <View className="flex-row items-center gap-1 rounded-full bg-gray-100 px-3 py-1">
                            <Text className="text-xs text-gray-700">
                              {group.completion.completed}/{group.completion.total} abgeschlossen
                            </Text>
                          </View>
                        )}
                      </View>
                    )}
                  </View>

                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    className="px-0"
                    contentContainerStyle={{ paddingRight: 16 }}
                    pagingEnabled={true}
                    snapToInterval={300}
                    decelerationRate="fast"
                    snapToOffsets={group.topics.map((topic, index) => index * 300)}
                  >
                    {group.topics.map((topic) => {
                      const topicVersion = topic.expand?.currentVersion;
                      const categoryColor = group.category.color || '#6b7280';
                      const completed = isTopicCompleted(topic.id);
                      const imageUrl = topicVersion?.image
                        ? getPocketBaseFileUrl(
                          topicVersion.collectionId,
                          topicVersion.id,
                          topicVersion.image
                        )
                        : null;
                      const titleParts = topicVersion?.titleDE?.split('||') || ['', ''];

                      return (
                        <TouchableOpacity
                          key={topic.id}
                          onPress={() => handleTopicPress(topic)}
                          disabled={topicActionInProgress === topic.id}
                          className="mr-4"
                          style={{ width: 300 }}
                          activeOpacity={0.9}
                        >
                          <View
                            className="relative h-80 rounded-3xl overflow-hidden"
                            style={{
                              backgroundColor: categoryColor,
                              shadowColor: categoryColor,
                              shadowOffset: { width: 0, height: 8 },
                              shadowOpacity: 0.3,
                              shadowRadius: 12,
                              elevation: 8,
                            }}
                          >
                            {/* Gradient Overlay for depth */}
                            <LinearGradient
                              colors={['rgba(255,255,255,0.1)', 'rgba(0,0,0,0.1)']}
                              style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, zIndex: 1 }}
                            />

                            {/* Completion Badge */}
                            {completed && (
                              <View className="absolute right-4 top-4 flex-row items-center gap-1.5 rounded-full bg-white/90 backdrop-blur-md px-3 py-1.5 z-20 shadow-sm">
                                <BadgeCheck size={14} color="#0f766e" />
                                <Text className="text-xs font-semibold text-teal-700 tracking-wide">FERTIG</Text>
                              </View>
                            )}

                            {/* Topic Image - Artistic positioning */}
                            {imageUrl && (
                              <Image
                                source={{ uri: imageUrl }}
                                className="absolute -right-10 -bottom-16 w-64 h-64 z-0 opacity-30 mix-blend-multiply"
                                style={{ transform: [{ rotate: '-12deg' }] }}
                                resizeMode="contain"
                              />
                            )}

                            {/* Content Container */}
                            <View className="w-full h-full p-6 flex flex-col justify-end">
                              {/* Top Section (Title) */}
                              <View className="mb-4 flx flex-col gap-1">
                                <Text className="text-xl font-bold text-black/80 leading-tight">
                                {titleParts[0].trim()}
                                </Text>
                                <Text className="text-xl text-black/80 leading-tight">
                                  {titleParts[1].trim()}
                                </Text>
                              </View>

                              {/* Bottom Section (CTA) */}
                              <View className="flex-row items-center">
                                <View className="h-8 w-8 rounded-full bg-white/20 backdrop-blur-md items-center justify-center border border-white/30">
                                  <Play size={20} color="white" fill="white" style={{ marginLeft: 2 }} />
                                </View>
                                <Text className="ml-3 text-white font-medium tracking-wide opacity-90">
                                  {completed ? 'Wiederholen' : 'Starten'}
                                </Text>
                              </View>
                            </View>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Restart Confirmation Dialog - Shown when clicking on a completed module */}
      <Modal
        visible={showRestartConfirm}
        transparent
        animationType="fade"
        onRequestClose={closeRestartModal}
      >
        <TouchableWithoutFeedback onPress={closeRestartModal}>
          <View className="flex-1 items-center justify-center bg-black/50 px-4">
            <TouchableWithoutFeedback onPress={() => {}}>
              <View className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
                <Text className="mb-2 text-xl font-bold text-gray-900">Modul neu starten?</Text>
                <Text className="mb-6 text-gray-600">
                  Möchtest du das Modul erneut durchlaufen oder deine bisherigen Ergebnisse ansehen?
                </Text>
                
                <View className="flex-row gap-3">
                  <TouchableOpacity
                    onPress={async () => {
                      if (selectedTopic && !isRestartingTopic) {
                        setIsRestartingTopic(true);
                        try {
                          await startFreshSession(selectedTopic);
                        } finally {
                          setIsRestartingTopic(false);
                        }
                      }
                    }}
                    disabled={isRestartingTopic}
                    className="flex-1 rounded-lg px-4 py-3"
                    style={{
                      backgroundColor:
                        selectedTopic?.expand?.currentVersion?.expand?.category?.color || baseColors.primary,
                    }}
                  >
                    <Text className="text-center font-semibold text-white">
                      {isRestartingTopic ? 'Starte...' : 'Neu starten'}
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    onPress={() => {
                      if (selectedTopic) {
                        // Navigate to view results (summary page)
                        closeRestartModal();
                        navigateToTopic(selectedTopic);
                      }
                    }}
                    className="flex-1 rounded-lg bg-gray-100 px-4 py-3"
                  >
                    <Text className="text-center font-semibold text-gray-700">Ergebnisse ansehen</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}
