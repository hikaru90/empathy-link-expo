/**
 * Utility functions to calculate Super Communicator points
 * This is a frontend fallback until the backend endpoint is implemented
 */

import { AnalysisDetail } from '../api/analysis';

// Level definitions
const LEVELS = [
  { id: 1, name: 'Beginner', minPoints: 0, maxPoints: 100 },
  { id: 2, name: 'Aware', minPoints: 101, maxPoints: 250 },
  { id: 3, name: 'Observer', minPoints: 251, maxPoints: 500 },
  { id: 4, name: 'Feeling Explorer', minPoints: 501, maxPoints: 750 },
  { id: 5, name: 'Need Navigator', minPoints: 751, maxPoints: 1000 },
  { id: 6, name: 'Request Maker', minPoints: 1001, maxPoints: 1500 },
  { id: 7, name: 'Empathy Builder', minPoints: 1501, maxPoints: 2000 },
  { id: 8, name: 'Balanced Communicator', minPoints: 2001, maxPoints: 3000 },
  { id: 9, name: 'Master Communicator', minPoints: 3001, maxPoints: 5000 },
  { id: 10, name: 'Super Communicator', minPoints: 5001, maxPoints: Infinity },
];

export interface SuperCommunicatorData {
  totalPoints: number;
  currentLevel: number;
  levelName: string;
  pointsInCurrentLevel: number;
  pointsNeededForNextLevel: number;
  progressPercentage: number;
  recentPoints?: Array<{
    date: string;
    points: number;
    source: 'chat' | 'learning' | 'resolution';
  }>;
}

/**
 * Calculate points for a single chat analysis
 */
function calculateChatPoints(analysis: AnalysisDetail): number {
  let points = 10; // Base completion bonus

  // I-Statement Muscle (0-1 scale)
  if (analysis.iStatementMuscle !== undefined) {
    if (analysis.iStatementMuscle >= 0.7) points += 15;
    else if (analysis.iStatementMuscle >= 0.4) points += 10;
    else if (analysis.iStatementMuscle >= 0.1) points += 5;
  }

  // Empathy Rate (0-1 scale)
  if (analysis.empathyRate !== undefined) {
    if (analysis.empathyRate >= 0.7) points += 15;
    else if (analysis.empathyRate >= 0.4) points += 10;
    else if (analysis.empathyRate >= 0.1) points += 5;
  }

  // Feeling Vocabulary (number of unique feelings)
  const feelingCount = analysis.feelings?.length || 0;
  if (feelingCount >= 5) points += 10;
  else if (feelingCount >= 3) points += 7;
  else if (feelingCount >= 1) points += 5;

  // Clarity of Ask
  if (analysis.clarityOfAsk === 'clear') points += 10;
  else if (analysis.clarityOfAsk === 'moderate') points += 5;

  // Emotional Balance (0-1 scale, ideal is 0.4-0.6)
  if (analysis.emotionalBalance !== undefined) {
    if (analysis.emotionalBalance >= 0.4 && analysis.emotionalBalance <= 0.6) {
      points += 10;
    } else if (
      (analysis.emotionalBalance >= 0.3 && analysis.emotionalBalance < 0.4) ||
      (analysis.emotionalBalance > 0.6 && analysis.emotionalBalance <= 0.7)
    ) {
      points += 5;
    }
  }

  // Conflict Resolution Bonus
  if (analysis.requestResolved) points += 25;
  else if (analysis.request && analysis.request.trim().length > 0) {
    points += 10; // Active resolution attempt
  }

  return points;
}

/**
 * Calculate total points from analyses
 */
export function calculatePointsFromAnalyses(analyses: AnalysisDetail[]): {
  totalPoints: number;
  recentPoints: Array<{ date: string; points: number; source: 'chat' | 'learning' | 'resolution' }>;
} {
  let totalPoints = 0;
  const recentPoints: Array<{ date: string; points: number; source: 'chat' | 'learning' | 'resolution' }> = [];

  // Sort analyses by date (newest first)
  const sortedAnalyses = [...analyses].sort(
    (a, b) => new Date(b.created).getTime() - new Date(a.created).getTime()
  );

  // Calculate points for each analysis
  sortedAnalyses.forEach((analysis) => {
    const points = calculateChatPoints(analysis);
    totalPoints += points;

    // Track recent points (last 10)
    if (recentPoints.length < 10) {
      recentPoints.push({
        date: analysis.created,
        points,
        source: analysis.requestResolved ? 'resolution' : 'chat',
      });
    }
  });

  return { totalPoints, recentPoints };
}

/**
 * Get level information based on total points
 */
function getLevelInfo(totalPoints: number): {
  currentLevel: number;
  levelName: string;
  pointsInCurrentLevel: number;
  pointsNeededForNextLevel: number;
  progressPercentage: number;
} {
  // Find current level
  const currentLevel = LEVELS.find(
    (level) => totalPoints >= level.minPoints && totalPoints <= level.maxPoints
  ) || LEVELS[0];

  const nextLevel = LEVELS.find((level) => level.id === currentLevel.id + 1);

  const pointsInCurrentLevel = totalPoints - currentLevel.minPoints;
  const levelRange = currentLevel.maxPoints - currentLevel.minPoints;
  const progressPercentage = nextLevel
    ? (pointsInCurrentLevel / levelRange) * 100
    : 100;

  const pointsNeededForNextLevel = nextLevel
    ? nextLevel.minPoints - totalPoints
    : 0;

  return {
    currentLevel: currentLevel.id,
    levelName: currentLevel.name,
    pointsInCurrentLevel,
    pointsNeededForNextLevel,
    progressPercentage: Math.min(100, Math.max(0, progressPercentage)),
  };
}

/**
 * Calculate Super Communicator data from analyses
 * This is a frontend fallback until the backend endpoint is ready
 */
export function calculateSuperCommunicatorData(
  analyses: AnalysisDetail[]
): SuperCommunicatorData {
  const { totalPoints, recentPoints } = calculatePointsFromAnalyses(analyses);
  const levelInfo = getLevelInfo(totalPoints);

  return {
    totalPoints,
    ...levelInfo,
    recentPoints: recentPoints.slice(0, 5), // Show last 5 activities
  };
}

