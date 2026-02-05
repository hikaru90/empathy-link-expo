export const ONBOARDING_STORAGE_KEY = 'onboardingCompleted';

export type OnboardingStep = {
  title: string;
  image: string;
  content: string;
  component?: 'userGoal';
};

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    title: 'Willkommen bei Empathy-Link',
    image: require('@/assets/images/illustration-speechbubbles.png'),
    content:
    'Schön, dass du hier bist. Wir unterstützen dich dabei, klarer und empathischer zu kommunizieren, um dich selbst und andere besser zu verstehen.',
  },
  {
    title: 'Was möchtest du erreichen?',
    image: require('@/assets/images/illustration-hands.png'),
    content: '',
    component: 'userGoal',
  },
  {
    title: 'Empathie lohnt sich',
    image: require('@/assets/images/illustration-hearthand.png'),
    content:
      'Enge, positive Beziehungen sind einer der wichtigsten Faktoren für Gesundheit, Wohlbefinden und Lebenszufriedenheit – wichtiger als Erfolg, Einkommen oder Status. Gute Verbindung zu anderen bedeutet ein gutes Leben.',
  },
  {
    title: 'Spür mal rein',
    image: require('@/assets/images/illustration-hearts.png'),
    content:
      'Wenn wir unsere Gefühle benennen, entsteht mehr Klarheit. Wir verstehen uns selbst besser – Irritationen werden greifbar, und wir reagieren weniger impulsiv. Das hilft uns, bewusster und gelassener zu handeln.',
  },
  {
    title: 'Deine Gespräche gehören dir!',
    image: require('@/assets/images/illustration-character.png'),
    content:
      'Dein persönlicher Coach wird von KI unterstützt. Sie hilft dir, deine Gefühle, Bedürfnisse und Muster zu reflektieren. Alle Daten sind sicher verschlüsselt, nur für dich sichtbar und nicht zurückverfolgbar.',
  },
  {
    title: 'Deine Empathie-Reise kann starten!',
    image: require('@/assets/images/illustration-heartlilac.png'),
    content:
      'Danke, dass du dir Zeit genommen hast. Dein Coach ist jetzt für dich da – lass uns gemeinsam beginnen.',
  },
];

export const USER_GOALS = [
  'Ich möchte meine Emotionen besser verstehen.',
  'Ich möchte lernen, Konflikte als Chance zu sehen.',
  'Ich möchte Konflikte schneller ansprechen.',
  'Ich wünsche mir mehr Ruhe und Gelassenheit für schwierige Gespräche.',
  'Ich möchte mich selbst und andere besser verstehen.',
  'Ich möchte meine Beziehungen stärken.',
] as const;
