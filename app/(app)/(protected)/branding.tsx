import baseColors from '@/baseColors.config';
import { ChevronDown, ChevronRight } from 'lucide-react-native';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface BrandData {
  mission?: string;
  purpose?: string;
  why?: string;
  cause?: string;
  values?: Array<{ name: string; description: string }>;
  personality?: Array<{ archetype: string; tagline: string; motiv: string; description: string; examples: string }>;
  targetAudience?: {
    personas?: Array<{ name: string; group: string; age: string; profession: string; motivation: string; challenges: string; goals: string; techAffinity: string }>;
    goals?: string[];
    problems?: string[];
    impact?: string[];
    desires?: string[];
  };
  voice?: string;
  tagline?: string;
  creativeDirectorFeedback?: {
    strengths?: string[];
    gaps?: Array<{ category: string; items: string[] }>;
    concepts?: Array<{ name: string; description: string; application: string }>;
    recommendations?: Array<{ priority: string; item: string; description: string }>;
  };
  websiteAnalysis?: {
    typography?: string;
    iconLanguage?: string;
    imageStyle?: string;
    toneOfVoiceExamples?: Array<{ context: string; example: string }>;
    brandPromise?: string;
    visualElements?: string[];
  };
}

// Branding-Daten aus unserem Chat-Prozess
// Diese werden hier aktualisiert, während wir den Branding-Prozess durchgehen
const brandData: BrandData = {
  mission: 'Menschen befähigen, klarer und empathischer zu kommunizieren, damit sie echte Verbindung schaffen – in Beziehungen, Teams und Gesellschaft. Wir bauen die führende Plattform für empathische Kommunikation – skalierbar, KI-gestützt und gesellschaftlich relevant. Unsere Vision ist eine Welt, in der Menschen lernen, Konflikte als Chance zu begreifen, klar zu kommunizieren und in Verbindung zu bleiben – ob im Team, im Job oder in persönlichen Beziehungen. Mit unserer Technologie machen wir Empathie messbar, trainierbar und im Alltag anwendbar – für Millionen Nutzer:innen weltweit. Denn in einer Welt von KI wird empathische Kommunikation zur wichtigsten Zukunftskompetenz.',
  purpose: 'Menschen befähigen, klarer und empathischer zu kommunizieren, damit sie echte Verbindung schaffen – in Beziehungen, Teams und Gesellschaft.',
  why: 'Empathie ist die wichtigste Fähigkeit unserer Zeit.\n\nEmpathie ist eine Superpower und keiner bringt sie uns richtig bei.\n\nUnsere Gesellschaft scheitert an schlechter Kommunikation – in Beziehungen, Teams und Demokratien. Niemand bringt uns bei, wie man aufrichtig zuhört, wertschätzend Feedback gibt oder Konflikte gut löst. Studien zeigen: Teams, die empathisch kommunizieren, arbeiten besser zusammen. Beziehungen halten länger. Konflikte eskalieren weniger.\n\nWir glauben: Empathische Kommunikation ist eine Zukunftskompetenz.\n\nWir machen sie zugänglich, trainierbar und alltagstauglich – durch Technologie, die nicht trennt, sondern verbindet. Kommunikation neu lernen. Empathie neu erleben.\n\nTrainiere deinen Empathie-Muskel.',
  cause: 'Ensure healthy lives and promote well-being',
  values: [
    {
      name: 'Empathie',
      description: 'Wir wollen verstehen, nicht bewerten. Wir glauben, dass echtes Verstehen der Anfang jeder Verbindung ist – und trainierbar sein sollte. Empathie ist für uns kein „Nice to have", sondern Grundlage für menschliches Miteinander und Innovation.',
    },
    {
      name: 'Mut',
      description: 'Wir reden über das, was andere vermeiden. Mut zur Klarheit, zum Konflikt, zum ehrlichen Gespräch. Wir glauben: Echtheit braucht Courage – und wir schaffen Räume, in denen Menschen sie entwickeln können.',
    },
    {
      name: 'Verbindung',
      description: 'Kommunikation ist Beziehung. Wir bauen Brücken, nicht Mauern. Wir gestalten Tools, die nicht nur Sprache optimieren, sondern Beziehungen stärken – zwischen Menschen, in Teams, in der Gesellschaft.',
    },
    {
      name: 'Wachstum',
      description: 'Kommunikation ist ein Lernweg. Fehler sind erlaubt. Entwicklung ist erwünscht. Wir helfen Menschen, in ihrer Kommunikation zu wachsen – durch Feedback, Reflexion und technologische Unterstützung.',
    },
    {
      name: 'Technologie im Dienst des Menschlichen',
      description: 'Wir glauben an digitale Lösungen, die das Menschliche fördern – nicht ersetzen. Unsere Tools sollen die beste Version von uns selbst zugänglich machen – empathischer, bewusster, klarer.',
    },
  ],
  personality: [
    {
      archetype: 'Caregiver',
      tagline: 'Ich bin für dich da.',
      motiv: 'Service, Verbindung, Fürsorge',
      description: 'Ihr helft Menschen, ihre Kommunikation zu verbessern, um sich selbst und andere besser zu verstehen. Ihr schafft psychologische Sicherheit und Räume für Wachstum. Ihr seid nicht belehrend, sondern unterstützend – „Wir helfen dir, empathischer zu sein, weil wir es selbst auch lernen mussten."',
      examples: 'WWF, Dove',
    },
    {
      archetype: 'Sage',
      tagline: 'Verstehen verändert alles.',
      motiv: 'Wissen, Klarheit, Erkenntnis',
      description: 'Ihr vermittelt Wissen über Kommunikation, Selbstreflexion, GFK. Ihr nutzt Technologie, um Lernen zu ermöglichen – mit Tiefe und Haltung. Ihr gebt Nutzer:innen Werkzeuge, um sich und andere besser zu durchdringen.',
      examples: 'Google, TED',
    },
    {
      archetype: 'Magician',
      tagline: 'Transformation ist möglich.',
      motiv: 'Wandlung, Potenzial entfalten',
      description: 'Ihr glaubt, dass Kommunikation nicht einfach ein Skill ist, sondern eine transformative Kraft. Eure App ist ein „Bullshit-Translator", ein empathischer Shift – aus Konflikt wird Verbindung. Ihr nutzt KI nicht als kalte Technologie, sondern als Mittel, um Menschlichkeit zu fördern.',
      examples: 'Disney, Apple (teilweise)',
    },
  ],
  targetAudience: {
    personas: [
    {
      name: 'Lisa - die Selbstentwicklerin',
      group: 'Personen, die sich auf persönliches Wachstum und Selbstreflexion konzentrieren',
      age: '28-45 Jahre',
      profession: 'Kreative Berufe, Freelancerin, oder Angestellte im Bereich Marketing/Design',
      motivation: 'Persönliche Weiterentwicklung, verbesserte emotionale Intelligenz, Stärkung der Resilienz',
      challenges: 'Unsicherheit in zwischenmenschlichen Situationen, Schwierigkeiten, eigene Bedürfnisse zu erkennen und auszudrücken',
      goals: 'Klarheit über ihre Gefühle und Bedürfnisse gewinnen, authentische Beziehungen aufbauen',
      techAffinity: 'Nutzt gerne Apps, Journaling-Tools und Selfcare-Tracker',
    },
    {
      name: 'Max - der Konfliktlöser',
      group: 'Menschen, die Konflikte in persönlichen oder beruflichen Beziehungen bewältigen möchten',
      age: '35-55 Jahre',
      profession: 'Führungskraft, Projektmanager oder Elternteil',
      motivation: 'Konflikte effektiv lösen, Beziehungen stärken, Stress reduzieren',
      challenges: 'Schwierigkeiten, in hitzigen Situationen ruhig zu bleiben, Angst vor Konfrontation',
      goals: 'Konflikte deeskalieren, Werkzeuge für gewaltfreie Kommunikation erlernen',
      techAffinity: 'Nutzt Apps, die konkret im Alltag helfen (z. B. Kalender, Coaching-Tools)',
    },
    {
      name: 'Anna & Tom – Das Paar auf der Suche nach Verbindung',
      group: 'Paare',
      age: '30-50 Jahre',
      profession: 'Unterschiedlich, oft Eltern oder in langjährigen Beziehungen',
      motivation: 'Beziehung stärken, Missverständnisse vermeiden, Nähe und Vertrauen aufbauen',
      challenges: 'Unausgesprochene Bedürfnisse, Konflikte, die sich wiederholen',
      goals: 'Besser zuhören, echte Verbindung aufbauen, Freude an gemeinsamen Gesprächen wiederentdecken',
      techAffinity: 'Suchen praktische Tools, die sie gemeinsam nutzen können',
    },
    {
      name: 'Julia - die GFK-Enthusiastin',
      group: 'GFK-Interessierte',
      age: '25-40 Jahre',
      profession: 'Sozialarbeiterin, Lehrerin oder Aktivistin',
      motivation: 'Tieferes Verständnis und Anwendung der Gewaltfreien Kommunikation',
      challenges: 'Integration der Theorie in den Alltag, geduldige Umsetzung in schwierigen Gesprächen',
      goals: 'GFK in Alltag und Beruf verankern, authentische Beziehungen leben',
      techAffinity: 'Begeistert von Apps, die GFK spielerisch oder praxisnah vermitteln',
    },
    {
      name: 'Markus – Der professionelle Anwender',
      group: 'Therapeuten, Coaches oder Pädagogen',
      age: '35-60 Jahre',
      profession: 'Coach, Psychotherapeut oder Lehrer',
      motivation: 'Klienten oder Schülern Werkzeuge für bessere Kommunikation und Selbstreflexion an die Hand geben',
      challenges: 'Tools finden, die für verschiedene Zielgruppen geeignet und praxisnah sind',
      goals: 'Effiziente Vermittlung von Konzepten, Unterstützung beim Einstieg',
      techAffinity: 'Schätzt einfache Bedienbarkeit, didaktische Qualität und seriöse Inhalte',
    },
    {
      name: 'Sabine – Die Teamplayerin',
      group: 'Teams und Unternehmen, die ihre Kommunikation verbessern möchten',
      age: '30-55 Jahre',
      profession: 'HR-Managerin, Teamleiterin oder Führungskraft',
      motivation: 'Zusammenarbeit im Team stärken, Konflikte minimieren, effizientere Kommunikation',
      challenges: 'Unterschiedliche Persönlichkeiten und Kommunikationsstile im Team',
      goals: 'Harmonisches Arbeitsklima schaffen, Feedbackkultur verbessern',
      techAffinity: 'Bevorzugt Tools, die sich leicht in den Arbeitsalltag integrieren lassen',
    },
    ],
    goals: [
      'Besser kommunizieren in Konflikten (Job, Beziehung, Familie)',
      'Authentischer auftreten und Feedback geben können',
      'Emotionale Intelligenz stärken',
      'Missverständnisse vermeiden & sich klar ausdrücken',
      'Sich persönlich weiterentwickeln',
      'Beziehungen (beruflich/privat) vertiefen',
    ],
    problems: [
      'Konflikte eskalieren oder bleiben ungelöst',
      'Gespräche laufen aneinander vorbei oder verletzen',
      'Kommunikationsmuster aus der Kindheit/Burnout-Falle',
      'Kein Zugang zu „wie" man empathisch oder klar kommuniziert',
      'Seminare sind teuer, Bücher abstrakt, Alltag überfordert',
    ],
    impact: [
      'Sie erleben Selbstwirksamkeit in Konflikten',
      'Sie erkennen ihre Muster & können sie bewusst verändern',
      'Sie fühlen sich sicherer in schwierigen Gesprächen',
      'Sie kommunizieren klarer, empathischer & lösungsorientierter',
      'Sie bauen tiefere Beziehungen auf – beruflich & privat',
    ],
    desires: [
      'Echte Verbindung zu anderen (Partner:in, Kolleg:innen, Kindern)',
      'Endlich gehört und verstanden werden',
      'Mutiger und klarer kommunizieren',
      'Werkzeuge, die im Alltag funktionieren',
      'Ein digitaler Begleiter, der nicht überfordert, sondern stärkt',
    ],
  },
  voice: 'Gerne ernst, supportive, direkt, sanft und ermutigend, professionell doch stets leicht und positiv',
  tagline: 'Werde Superkommunikator*in',
  creativeDirectorFeedback: {
    strengths: [
      'Solide strategische Grundlagen (Purpose, Why, Values)',
      'Klare Personas mit Goals/Problems/Impact/Desires',
      'Gute Farbpalette (Purple als Primary passt zur Transformation)',
      'Tagline "Werde Superkommunikator*in" ist handlungsorientiert',
    ],
    gaps: [
      {
        category: 'Visual Identity (unvollständig)',
        items: [
          'Typografie: Welche Schriftarten? Hierarchie? Größen?',
          'Icon-Sprache: Welcher Stil? Komplexität? Verwendung?',
          'Bildsprache: Fotostil? Illustration? Moodboards?',
          'Motion Design: Animationen? Übergänge? Mikrointeraktionen?',
        ],
      },
      {
        category: 'Brand Story & Narrative',
        items: [
          'Wie wird die Marke erzählt? (Hero\'s Journey, Transformation)',
          'Key Messages für verschiedene Touchpoints',
          'Storytelling-Struktur für Onboarding, Features, Marketing',
        ],
      },
      {
        category: 'Tone of Voice (konkreter)',
        items: [
          'Aktuelle Beschreibung ist abstrakt',
          'Konkrete Beispiele: "So schreiben wir" vs. "So schreiben wir nicht"',
          'Dos & Don\'ts für verschiedene Kontexte',
        ],
      },
      {
        category: 'Brand Promise & Positioning',
        items: [
          'Was verspricht Empathy-Link konkret?',
          'Wo steht die Marke im Markt? (Competitive Landscape)',
          'Unique Selling Proposition (USP)',
        ],
      },
      {
        category: 'Visual Concepts & Metaphors',
        items: [
          '"Empathie-Muskel" ist gut, aber visuell ausbauen',
          'Weitere Metaphern: Brücken, Verbindungen, Wellen, Resonanz',
          'Visuelle Richtungen für verschiedene Anwendungsfälle',
        ],
      },
    ],
    concepts: [
      {
        name: 'The Empathy Bridge',
        description: 'Visuelle Metapher: Brücken zwischen Menschen',
        application: 'Icons zeigen Verbindungen, Illustrationen zeigen Transformation, Motion: Elemente verbinden sich sanft',
      },
      {
        name: 'Growth Through Layers',
        description: 'Visuelle Metapher: Schichten, die sich aufbauen (wie ein Muskel)',
        application: 'Progress-Visualisierungen, Skill-Level, Wachstum, Farbverlauf: Von blass zu intensiv (wie Training)',
      },
      {
        name: 'Human-Centered Tech',
        description: 'Balance zwischen Menschlichkeit und Technologie',
        application: 'Warme, organische Formen + präzise, digitale Elemente, Illustrationen zeigen Menschen, nicht nur UI',
      },
      {
        name: 'The Conversation Canvas',
        description: 'Jede Interaktion als Raum/Gespräch',
        application: 'Visuelle Sprache: Offene Räume, sanfte Übergänge, Typografie: Lesbar, einladend, nicht zu technisch',
      },
    ],
    recommendations: [
      {
        priority: 'Hoch',
        item: 'Typografie-System definieren',
        description: 'Headline-Font (z.B. Inter Bold für Impact), Body-Font (z.B. Inter Regular für Lesbarkeit), Hierarchie: H1-H4, Body, Caption',
      },
      {
        priority: 'Hoch',
        item: 'Icon-Sprache entwickeln',
        description: 'Stil: Linear, Filled, oder Mixed? Komplexität: Minimalistisch oder detailliert? Konsistenz: Rounded oder Sharp?',
      },
      {
        priority: 'Mittel',
        item: 'Bildsprache/Moodboards',
        description: 'Fotostil: Authentisch, divers, warm, Illustration: Organisch, menschlich, nicht zu cartoonig, Farbverwendung: Purple als Akzent, nicht dominant',
      },
      {
        priority: 'Mittel',
        item: 'Tone of Voice Examples',
        description: 'Konkrete Beispiele für verschiedene Kontexte, Dos & Don\'ts Liste, Voice Guidelines für verschiedene Touchpoints',
      },
      {
        priority: 'Hoch',
        item: 'Brand Promise formulieren',
        description: 'Was verspricht Empathy-Link konkret? Messbar, nachvollziehbar, einzigartig',
      },
    ],
  },
  websiteAnalysis: {
    brandPromise: 'Mach Empathie zu deiner Superpower – Wir machen Empathie trainierbar, für alle.',
    typography: 'Klare Hierarchie mit Headings (H1-H3) und Body-Text. Schrift wirkt modern und lesbar, vermutlich Sans-Serif (Inter oder ähnlich).',
    iconLanguage: 'Icons für Module (Chat, Statistik, Lernen, Community) – minimalistisch, funktional. Verwendung von Icons zur visuellen Unterstützung der Module.',
    imageStyle: 'Phone Mockups zur App-Darstellung, authentische Fotos von Alex und Marie im "Über uns" Bereich. Warm, menschlich, nicht zu technisch.',
    toneOfVoiceExamples: [
      {
        context: 'Hero Section',
        example: 'Lass uns an den wertvollsten Ressourcen in deinem Leben arbeiten: Deine Beziehung zu dir und deine Beziehungen im Leben',
      },
      {
        context: 'Newsletter Signup',
        example: 'Wir spammen nicht. Du kannst dich jederzeit abmelden. Versprochen ✌️.',
      },
      {
        context: 'FAQ - Therapie',
        example: 'Du musst das nicht alleine schaffen. Es ist ein Zeichen von Stärke, sich Hilfe zu holen.',
      },
      {
        context: 'Feature Beschreibung',
        example: 'Egal ob Streit, innere Zerrissenheit oder Frust im Team – dein KI-Coach stellt dir die richtigen Fragen, damit du sortieren kannst und Klarheit für gute Gespräche findest.',
      },
      {
        context: 'Datenschutz',
        example: 'Konflikte sind zu intim, um sie einer KI einfach zu schenken. Wir wollen einen Safe Space für dich erschaffen, in dem du innerlich wachsen kannst.',
      },
    ],
    visualElements: [
      'Phone Mockups zur App-Visualisierung',
      'Icons für Module (Chat, Statistik, Lernen, Community)',
      'Authentische Fotos der Gründer (Alex und Marie)',
      'Klare Sektionen mit Headings und Subheadings',
      'CTA Buttons: "Jetzt kostenlos testen"',
      'Vertrauensindikatoren: Verschlüsselt, Kein Datenverkauf, etc.',
    ],
  },
};

export default function BrandingPage() {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    mission: true,
    purpose: true,
    why: true,
    values: true,
    personality: true,
    audience: true,
    voice: true,
    tagline: true,
    visual: true,
    feedback: true,
    websiteAnalysis: true,
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const SectionHeader = ({ 
    id, 
    title, 
    icon 
  }: { 
    id: string; 
    title: string; 
    icon: string;
  }) => (
    <TouchableOpacity
      style={styles.sectionHeader}
      onPress={() => toggleSection(id)}
      activeOpacity={0.7}
    >
      <View style={styles.sectionHeaderLeft}>
        <Text style={styles.sectionIcon}>{icon}</Text>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {expandedSections[id] ? (
        <ChevronDown size={20} color={baseColors.black} />
      ) : (
        <ChevronRight size={20} color={baseColors.black} />
      )}
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Brand Identity</Text>
        <Text style={styles.subtitle}>
          Visualisierung deiner Markenidentität
        </Text>
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            💡 Diese Seite zeigt die Ergebnisse unseres Branding-Prozesses aus dem Chat.
          </Text>
        </View>
      </View>

      {/* Mission & Vision */}
      {brandData.mission && (
        <View style={styles.section}>
          <SectionHeader id="mission" title="Mission & Vision" icon="🎯" />
          {expandedSections.mission && (
            <View style={styles.sectionContent}>
              <Text style={styles.contentText}>{brandData.mission}</Text>
              {brandData.cause && (
                <View style={styles.causeBox}>
                  <Text style={styles.causeLabel}>Cause:</Text>
                  <Text style={styles.causeText}>{brandData.cause}</Text>
                </View>
              )}
            </View>
          )}
        </View>
      )}

      {/* Purpose */}
      {brandData.purpose && (
        <View style={styles.section}>
          <SectionHeader id="purpose" title="Purpose" icon="💫" />
          {expandedSections.purpose && (
            <View style={styles.sectionContent}>
              <Text style={styles.contentText}>{brandData.purpose}</Text>
            </View>
          )}
        </View>
      )}

      {/* Brand Why */}
      {brandData.why && (
        <View style={styles.section}>
          <SectionHeader id="why" title="Brand Why" icon="💡" />
          {expandedSections.why && (
            <View style={styles.sectionContent}>
              <Text style={styles.whyText}>{brandData.why}</Text>
            </View>
          )}
        </View>
      )}

      {/* Brand Values */}
      {brandData.values && brandData.values.length > 0 && (
        <View style={styles.section}>
          <SectionHeader id="values" title="Brand Core Values" icon="💎" />
          {expandedSections.values && (
            <View style={styles.sectionContent}>
              {brandData.values.map((value, index) => (
                <View key={index} style={styles.valueCard}>
                  <Text style={styles.valueName}>{value.name}</Text>
                  <Text style={styles.valueDescription}>{value.description}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Brand Personality */}
      {brandData.personality && brandData.personality.length > 0 && (
        <View style={styles.section}>
          <SectionHeader id="personality" title="Brand Personality Archetypes" icon="✨" />
          {expandedSections.personality && (
            <View style={styles.sectionContent}>
              {brandData.personality.map((archetype, index) => (
                <View key={index} style={styles.archetypeCard}>
                  <View style={styles.archetypeHeader}>
                    <Text style={styles.archetypeName}>{archetype.archetype}</Text>
                    <Text style={styles.archetypeTagline}>"{archetype.tagline}"</Text>
                  </View>
                  <View style={styles.motivBox}>
                    <Text style={styles.motivLabel}>Motiv:</Text>
                    <Text style={styles.motivText}>{archetype.motiv}</Text>
                  </View>
                  <Text style={styles.archetypeDescription}>{archetype.description}</Text>
                  <View style={styles.examplesBox}>
                    <Text style={styles.examplesLabel}>Beispiel-Marken:</Text>
                    <Text style={styles.examplesText}>{archetype.examples}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Target Audience */}
      {brandData.targetAudience && (
        <View style={styles.section}>
          <SectionHeader id="audience" title="Target Audience" icon="👥" />
          {expandedSections.audience && (
            <View style={styles.sectionContent}>
              {/* Goals */}
              {brandData.targetAudience.goals && brandData.targetAudience.goals.length > 0 && (
                <View style={styles.audienceSubsection}>
                  <Text style={styles.audienceSubsectionTitle}>🎯 Goals</Text>
                  {brandData.targetAudience.goals.map((goal, index) => (
                    <View key={index} style={styles.listItem}>
                      <Text style={styles.listBullet}>•</Text>
                      <Text style={styles.listText}>{goal}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Problems */}
              {brandData.targetAudience.problems && brandData.targetAudience.problems.length > 0 && (
                <View style={styles.audienceSubsection}>
                  <Text style={styles.audienceSubsectionTitle}>⚠️ Problems</Text>
                  {brandData.targetAudience.problems.map((problem, index) => (
                    <View key={index} style={styles.listItem}>
                      <Text style={styles.listBullet}>•</Text>
                      <Text style={styles.listText}>{problem}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Impact */}
              {brandData.targetAudience.impact && brandData.targetAudience.impact.length > 0 && (
                <View style={styles.audienceSubsection}>
                  <Text style={styles.audienceSubsectionTitle}>✨ Impact</Text>
                  {brandData.targetAudience.impact.map((impact, index) => (
                    <View key={index} style={styles.listItem}>
                      <Text style={styles.listBullet}>•</Text>
                      <Text style={styles.listText}>{impact}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Desires */}
              {brandData.targetAudience.desires && brandData.targetAudience.desires.length > 0 && (
                <View style={styles.audienceSubsection}>
                  <Text style={styles.audienceSubsectionTitle}>💫 Desires</Text>
                  {brandData.targetAudience.desires.map((desire, index) => (
                    <View key={index} style={styles.listItem}>
                      <Text style={styles.listBullet}>•</Text>
                      <Text style={styles.listText}>{desire}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Personas */}
              {brandData.targetAudience.personas && brandData.targetAudience.personas.length > 0 && (
                <View style={styles.audienceSubsection}>
                  <Text style={styles.audienceSubsectionTitle}>👤 Personas</Text>
                  {brandData.targetAudience.personas.map((persona, index) => (
                    <View key={index} style={styles.personaCard}>
                      <Text style={styles.personaName}>{persona.name}</Text>
                      <View style={styles.personaInfo}>
                        <View style={styles.personaRow}>
                          <Text style={styles.personaLabel}>Gruppe:</Text>
                          <Text style={styles.personaValue}>{persona.group}</Text>
                        </View>
                        <View style={styles.personaRow}>
                          <Text style={styles.personaLabel}>Alter:</Text>
                          <Text style={styles.personaValue}>{persona.age}</Text>
                        </View>
                        <View style={styles.personaRow}>
                          <Text style={styles.personaLabel}>Beruf:</Text>
                          <Text style={styles.personaValue}>{persona.profession}</Text>
                        </View>
                        <View style={styles.personaDetailBox}>
                          <Text style={styles.personaDetailLabel}>Motivation:</Text>
                          <Text style={styles.personaDetailText}>{persona.motivation}</Text>
                        </View>
                        <View style={styles.personaDetailBox}>
                          <Text style={styles.personaDetailLabel}>Herausforderungen:</Text>
                          <Text style={styles.personaDetailText}>{persona.challenges}</Text>
                        </View>
                        <View style={styles.personaDetailBox}>
                          <Text style={styles.personaDetailLabel}>Ziele:</Text>
                          <Text style={styles.personaDetailText}>{persona.goals}</Text>
                        </View>
                        <View style={styles.personaDetailBox}>
                          <Text style={styles.personaDetailLabel}>Technikaffinität:</Text>
                          <Text style={styles.personaDetailText}>{persona.techAffinity}</Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>
      )}

      {/* Brand Voice */}
      {brandData.voice && (
        <View style={styles.section}>
          <SectionHeader id="voice" title="Brand Voice" icon="🗣️" />
          {expandedSections.voice && (
            <View style={styles.sectionContent}>
              <Text style={styles.contentText}>{brandData.voice}</Text>
            </View>
          )}
        </View>
      )}

      {/* Tagline */}
      {brandData.tagline && (
        <View style={styles.section}>
          <SectionHeader id="tagline" title="Tagline" icon="💬" />
          {expandedSections.tagline && (
            <View style={styles.sectionContent}>
              <Text style={styles.taglineText}>{brandData.tagline}</Text>
            </View>
          )}
        </View>
      )}

      {/* Visual Identity */}
      <View style={styles.section}>
        <SectionHeader id="visual" title="Visual Identity" icon="🎨" />
        {expandedSections.visual && (
          <View style={styles.sectionContent}>
            <Text style={styles.subsectionTitle}>Aktuelle Farbpalette:</Text>
            <View style={styles.colorGrid}>
              {Object.entries(baseColors).map(([name, color]) => (
                <View key={name} style={styles.colorItem}>
                  <View
                    style={[styles.colorSwatch, { backgroundColor: color }]}
                  />
                  <Text style={styles.colorName}>{name}</Text>
                  <Text style={styles.colorHex}>{color}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>

      {/* Creative Director Feedback */}
      {brandData.creativeDirectorFeedback && (
        <View style={styles.section}>
          <SectionHeader id="feedback" title="Creative Director Feedback" icon="💭" />
          {expandedSections.feedback && (
            <View style={styles.sectionContent}>
              {/* Strengths */}
              {brandData.creativeDirectorFeedback.strengths && brandData.creativeDirectorFeedback.strengths.length > 0 && (
                <View style={styles.feedbackSubsection}>
                  <Text style={styles.feedbackSubsectionTitle}>✅ Strengths</Text>
                  {brandData.creativeDirectorFeedback.strengths.map((strength, index) => (
                    <View key={index} style={styles.listItem}>
                      <Text style={styles.listBullet}>•</Text>
                      <Text style={styles.listText}>{strength}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Gaps */}
              {brandData.creativeDirectorFeedback.gaps && brandData.creativeDirectorFeedback.gaps.length > 0 && (
                <View style={styles.feedbackSubsection}>
                  <Text style={styles.feedbackSubsectionTitle}>⚠️ Gaps & Missing Elements</Text>
                  {brandData.creativeDirectorFeedback.gaps.map((gap, index) => (
                    <View key={index} style={styles.gapCard}>
                      <Text style={styles.gapCategory}>{gap.category}</Text>
                      {gap.items.map((item, itemIndex) => (
                        <View key={itemIndex} style={styles.listItem}>
                          <Text style={styles.listBullet}>•</Text>
                          <Text style={styles.listText}>{item}</Text>
                        </View>
                      ))}
                    </View>
                  ))}
                </View>
              )}

              {/* Concepts */}
              {brandData.creativeDirectorFeedback.concepts && brandData.creativeDirectorFeedback.concepts.length > 0 && (
                <View style={styles.feedbackSubsection}>
                  <Text style={styles.feedbackSubsectionTitle}>💡 Creative Concepts</Text>
                  {brandData.creativeDirectorFeedback.concepts.map((concept, index) => (
                    <View key={index} style={styles.conceptCard}>
                      <Text style={styles.conceptName}>{concept.name}</Text>
                      <Text style={styles.conceptDescription}>{concept.description}</Text>
                      <View style={styles.conceptApplicationBox}>
                        <Text style={styles.conceptApplicationLabel}>Anwendung:</Text>
                        <Text style={styles.conceptApplicationText}>{concept.application}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* Recommendations */}
              {brandData.creativeDirectorFeedback.recommendations && brandData.creativeDirectorFeedback.recommendations.length > 0 && (
                <View style={styles.feedbackSubsection}>
                  <Text style={styles.feedbackSubsectionTitle}>📋 Recommendations</Text>
                  {brandData.creativeDirectorFeedback.recommendations.map((rec, index) => (
                    <View key={index} style={styles.recommendationCard}>
                      <View style={styles.recommendationHeader}>
                        <Text style={styles.recommendationPriority}>{rec.priority}</Text>
                        <Text style={styles.recommendationItem}>{rec.item}</Text>
                      </View>
                      <Text style={styles.recommendationDescription}>{rec.description}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>
      )}

      {/* Website Analysis */}
      {brandData.websiteAnalysis && (
        <View style={styles.section}>
          <SectionHeader id="websiteAnalysis" title="Website Analysis (empathy-link.de)" icon="🌐" />
          {expandedSections.websiteAnalysis && (
            <View style={styles.sectionContent}>
              {/* Brand Promise */}
              {brandData.websiteAnalysis.brandPromise && (
                <View style={styles.analysisSubsection}>
                  <Text style={styles.analysisSubsectionTitle}>🎯 Brand Promise</Text>
                  <Text style={styles.analysisText}>{brandData.websiteAnalysis.brandPromise}</Text>
                </View>
              )}

              {/* Typography */}
              {brandData.websiteAnalysis.typography && (
                <View style={styles.analysisSubsection}>
                  <Text style={styles.analysisSubsectionTitle}>✍️ Typography</Text>
                  <Text style={styles.analysisText}>{brandData.websiteAnalysis.typography}</Text>
                </View>
              )}

              {/* Icon Language */}
              {brandData.websiteAnalysis.iconLanguage && (
                <View style={styles.analysisSubsection}>
                  <Text style={styles.analysisSubsectionTitle}>🎨 Icon Language</Text>
                  <Text style={styles.analysisText}>{brandData.websiteAnalysis.iconLanguage}</Text>
                </View>
              )}

              {/* Image Style */}
              {brandData.websiteAnalysis.imageStyle && (
                <View style={styles.analysisSubsection}>
                  <Text style={styles.analysisSubsectionTitle}>📸 Image Style</Text>
                  <Text style={styles.analysisText}>{brandData.websiteAnalysis.imageStyle}</Text>
                </View>
              )}

              {/* Tone of Voice Examples */}
              {brandData.websiteAnalysis.toneOfVoiceExamples && brandData.websiteAnalysis.toneOfVoiceExamples.length > 0 && (
                <View style={styles.analysisSubsection}>
                  <Text style={styles.analysisSubsectionTitle}>🗣️ Tone of Voice Examples</Text>
                  {brandData.websiteAnalysis.toneOfVoiceExamples.map((example, index) => (
                    <View key={index} style={styles.voiceExampleCard}>
                      <Text style={styles.voiceExampleContext}>{example.context}</Text>
                      <Text style={styles.voiceExampleText}>"{example.example}"</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Visual Elements */}
              {brandData.websiteAnalysis.visualElements && brandData.websiteAnalysis.visualElements.length > 0 && (
                <View style={styles.analysisSubsection}>
                  <Text style={styles.analysisSubsectionTitle}>👁️ Visual Elements</Text>
                  {brandData.websiteAnalysis.visualElements.map((element, index) => (
                    <View key={index} style={styles.listItem}>
                      <Text style={styles.listBullet}>•</Text>
                      <Text style={styles.listText}>{element}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>
      )}

      {/* Empty State */}
      {!brandData.mission && !brandData.values && !brandData.personality && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            Noch keine Branding-Daten vorhanden.{'\n'}
            Der Branding-Prozess wird im Chat durchgeführt.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: baseColors.background,
  },
  content: {
    padding: 20,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: baseColors.black,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: baseColors.black,
    opacity: 0.7,
    marginBottom: 16,
  },
  infoBox: {
    backgroundColor: baseColors.orange + '15',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: baseColors.orange,
  },
  infoText: {
    fontSize: 14,
    color: baseColors.black,
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  sectionIcon: {
    fontSize: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: baseColors.black,
  },
  sectionContent: {
    padding: 16,
    paddingTop: 0,
  },
  subsectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: baseColors.black,
    marginBottom: 12,
    opacity: 0.8,
  },
  contentText: {
    fontSize: 16,
    color: baseColors.black,
    lineHeight: 24,
  },
  whyText: {
    fontSize: 16,
    color: baseColors.black,
    lineHeight: 26,
  },
  causeBox: {
    marginTop: 16,
    padding: 16,
    backgroundColor: baseColors.forest + '15',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: baseColors.forest,
  },
  causeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: baseColors.black,
    marginBottom: 8,
  },
  causeText: {
    fontSize: 16,
    color: baseColors.black,
    fontStyle: 'italic',
  },
  valuesContainer: {
    gap: 16,
  },
  valueCard: {
    backgroundColor: baseColors.background,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: baseColors.primary,
  },
  valueName: {
    fontSize: 20,
    fontWeight: '700',
    color: baseColors.primary,
    marginBottom: 12,
  },
  valueDescription: {
    fontSize: 16,
    color: baseColors.black,
    lineHeight: 24,
    opacity: 0.9,
  },
  valueTag: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: baseColors.primary,
  },
  valueText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  personalityContainer: {
    gap: 16,
  },
  archetypeCard: {
    backgroundColor: baseColors.background,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: baseColors.purple,
  },
  archetypeHeader: {
    marginBottom: 16,
  },
  archetypeName: {
    fontSize: 24,
    fontWeight: '700',
    color: baseColors.purple,
    marginBottom: 8,
  },
  archetypeTagline: {
    fontSize: 18,
    fontWeight: '600',
    color: baseColors.black,
    fontStyle: 'italic',
    opacity: 0.8,
  },
  motivBox: {
    backgroundColor: baseColors.orange + '15',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  motivLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: baseColors.black,
  },
  motivText: {
    fontSize: 14,
    color: baseColors.black,
    fontWeight: '500',
  },
  archetypeDescription: {
    fontSize: 16,
    color: baseColors.black,
    lineHeight: 24,
    marginBottom: 16,
    opacity: 0.9,
  },
  examplesBox: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: baseColors.lilac,
  },
  examplesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: baseColors.black,
    opacity: 0.6,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  examplesText: {
    fontSize: 14,
    color: baseColors.black,
    fontStyle: 'italic',
  },
  personaCard: {
    backgroundColor: baseColors.background,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: baseColors.forest,
  },
  personaName: {
    fontSize: 22,
    fontWeight: '700',
    color: baseColors.forest,
    marginBottom: 16,
  },
  personaInfo: {
    gap: 12,
  },
  personaRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  personaLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: baseColors.black,
    width: 80,
    opacity: 0.7,
  },
  personaValue: {
    fontSize: 14,
    color: baseColors.black,
    flex: 1,
  },
  personaDetailBox: {
    marginTop: 8,
    padding: 12,
    backgroundColor: baseColors.forest + '10',
    borderRadius: 8,
  },
  personaDetailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: baseColors.black,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    opacity: 0.7,
  },
  personaDetailText: {
    fontSize: 14,
    color: baseColors.black,
    lineHeight: 20,
  },
  audienceSubsection: {
    marginBottom: 24,
  },
  audienceSubsectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: baseColors.black,
    marginBottom: 12,
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  listBullet: {
    fontSize: 16,
    color: baseColors.primary,
    marginRight: 8,
    marginTop: 2,
  },
  listText: {
    fontSize: 14,
    color: baseColors.black,
    lineHeight: 20,
    flex: 1,
  },
  feedbackSubsection: {
    marginBottom: 24,
  },
  feedbackSubsectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: baseColors.black,
    marginBottom: 12,
  },
  gapCard: {
    backgroundColor: baseColors.orange + '10',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: baseColors.orange,
  },
  gapCategory: {
    fontSize: 16,
    fontWeight: '700',
    color: baseColors.black,
    marginBottom: 12,
  },
  conceptCard: {
    backgroundColor: baseColors.purple + '10',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: baseColors.purple,
  },
  conceptName: {
    fontSize: 18,
    fontWeight: '700',
    color: baseColors.purple,
    marginBottom: 8,
  },
  conceptDescription: {
    fontSize: 14,
    color: baseColors.black,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  conceptApplicationBox: {
    backgroundColor: baseColors.background,
    borderRadius: 8,
    padding: 12,
  },
  conceptApplicationLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: baseColors.black,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    opacity: 0.7,
  },
  conceptApplicationText: {
    fontSize: 14,
    color: baseColors.black,
    lineHeight: 20,
  },
  recommendationCard: {
    backgroundColor: baseColors.forest + '10',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: baseColors.forest,
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  recommendationPriority: {
    fontSize: 12,
    fontWeight: '700',
    color: baseColors.forest,
    backgroundColor: baseColors.forest + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    textTransform: 'uppercase',
  },
  recommendationItem: {
    fontSize: 16,
    fontWeight: '700',
    color: baseColors.black,
    flex: 1,
  },
  recommendationDescription: {
    fontSize: 14,
    color: baseColors.black,
    lineHeight: 20,
    opacity: 0.9,
  },
  analysisSubsection: {
    marginBottom: 24,
  },
  analysisSubsectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: baseColors.black,
    marginBottom: 12,
  },
  analysisText: {
    fontSize: 14,
    color: baseColors.black,
    lineHeight: 20,
  },
  voiceExampleCard: {
    backgroundColor: baseColors.lilac + '20',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: baseColors.purple,
  },
  voiceExampleContext: {
    fontSize: 12,
    fontWeight: '600',
    color: baseColors.black,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    opacity: 0.7,
  },
  voiceExampleText: {
    fontSize: 14,
    color: baseColors.black,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  traitTag: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: baseColors.lilac,
    borderWidth: 1,
    borderColor: baseColors.purple,
  },
  traitText: {
    fontSize: 14,
    fontWeight: '500',
    color: baseColors.black,
  },
  taglineText: {
    fontSize: 20,
    fontWeight: '600',
    color: baseColors.primary,
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 20,
    backgroundColor: baseColors.primary + '15',
    borderRadius: 12,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 12,
  },
  colorItem: {
    alignItems: 'center',
    width: 100,
  },
  colorSwatch: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  colorName: {
    fontSize: 12,
    fontWeight: '600',
    color: baseColors.black,
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  colorHex: {
    fontSize: 10,
    color: baseColors.black,
    opacity: 0.6,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: baseColors.black,
    opacity: 0.5,
    textAlign: 'center',
    lineHeight: 24,
  },
});
