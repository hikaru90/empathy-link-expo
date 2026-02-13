/**
 * Central registry for learn block types: step count, step label, and test actions.
 * Single source of truth so the page and tests don't duplicate switch logic.
 */

export type LearnBlockType =
  | 'title'
  | 'summary'
  | 'text'
  | 'heading'
  | 'list'
  | 'image'
  | 'timer'
  | 'task'
  | 'sortable'
  | 'multipleChoice'
  | 'breathe'
  | 'audio'
  | 'aiQuestion'
  | 'feelingsDetective'
  | 'bodymap'
  | 'needsDetective'
  | 'needsRubiksCube';

export type TestAction =
  | 'next'
  | 'prev'
  | 'input-send'
  | 'multiple-choice'
  | 'sortable'
  | 'timer'
  | 'breathe'
  | 'bodymap'
  | 'feelings-drawer'
  | 'task-complete';

export interface LearnBlockDescriptor {
  stepCount: (content: any) => number;
  stepLabel: string;
  testActions?: TestAction[];
}

const DESCRIPTORS: Record<LearnBlockType, LearnBlockDescriptor> = {
  title: {
    stepCount: () => 1,
    stepLabel: 'Start',
  },
  summary: {
    stepCount: () => 1,
    stepLabel: 'Zusammenfassung ✦',
  },
  text: {
    stepCount: () => 1,
    stepLabel: 'Text',
    testActions: ['next'],
  },
  heading: {
    stepCount: () => 1,
    stepLabel: 'Überschrift',
    testActions: ['next'],
  },
  list: {
    stepCount: () => 1,
    stepLabel: 'Liste',
    testActions: ['next'],
  },
  image: {
    stepCount: () => 1,
    stepLabel: 'Bild',
    testActions: ['next'],
  },
  timer: {
    stepCount: () => 1,
    stepLabel: 'Timer',
    testActions: ['timer', 'next'],
  },
  task: {
    stepCount: () => 1,
    stepLabel: 'Aufgabe',
    testActions: ['task-complete', 'next'],
  },
  sortable: {
    stepCount: () => 1,
    stepLabel: 'Sortieren',
    testActions: ['sortable', 'next'],
  },
  multipleChoice: {
    stepCount: () => 1,
    stepLabel: 'Multiple Choice',
    testActions: ['multiple-choice', 'next'],
  },
  breathe: {
    stepCount: () => 1,
    stepLabel: 'Atmen',
    testActions: ['breathe', 'next'],
  },
  audio: {
    stepCount: () => 1,
    stepLabel: 'Audio',
    testActions: ['next'],
  },
  aiQuestion: {
    stepCount: () => 2,
    stepLabel: 'KI-Frage ✦',
    testActions: ['input-send', 'next'],
  },
  feelingsDetective: {
    stepCount: () => 5,
    stepLabel: 'Gefühls-Detektiv ✦',
    testActions: ['input-send', 'feelings-drawer', 'next'],
  },
  bodymap: {
    stepCount: () => 2,
    stepLabel: 'Körperkarte',
    testActions: ['bodymap', 'next'],
  },
  needsDetective: {
    stepCount: () => 4,
    stepLabel: 'Bedürfnis-Detektiv ✦',
    testActions: ['input-send', 'next'],
  },
  needsRubiksCube: {
    stepCount: () => 2,
    stepLabel: 'Bedürfnis-Rubik ✦',
    testActions: ['input-send', 'next'],
  },
};

export function getBlockStepCount(blockType: string, content: any): number {
  const d = DESCRIPTORS[blockType as LearnBlockType];
  return d ? d.stepCount(content) : 1;
}

export function getBlockStepLabel(blockType: string): string {
  const d = DESCRIPTORS[blockType as LearnBlockType];
  return d?.stepLabel ?? blockType;
}

export function getBlockTestActions(blockType: string): TestAction[] | undefined {
  const d = DESCRIPTORS[blockType as LearnBlockType];
  return d?.testActions;
}

export function getStepComponentName(stepData: { component: string } | null): string {
  if (!stepData) return '';
  return getBlockStepLabel(stepData.component);
}

/** Build total steps array from content; used by [slug].tsx */
export function buildTotalStepsArray(
  content: any[]
): Array<{ component: string; internalStep: number; blockIndex: number }> {
  const totalStepsArray: Array<{ component: string; internalStep: number; blockIndex: number }> = [];
  totalStepsArray.push({ component: 'title', internalStep: 0, blockIndex: -1 });
  content.forEach((item: any, index: number) => {
    const type = item.type || 'text';
    const stepCount = getBlockStepCount(type, item);
    for (let i = 0; i < stepCount; i++) {
      totalStepsArray.push({ component: type, internalStep: i, blockIndex: index });
    }
  });
  totalStepsArray.push({ component: 'summary', internalStep: 0, blockIndex: -1 });
  return totalStepsArray;
}
