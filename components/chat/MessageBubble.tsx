/**
 * Message bubble component for displaying chat messages
 */

import baseColors from '@/baseColors.config';
import type { HistoryEntry } from '@/lib/api/chat';
import { Play, RefreshCw, Square } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

interface MessageBubbleProps {
  message: HistoryEntry;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  // Don't render hidden messages
  if (message.hidden) {
    return null;
  }

  const isUser = message.role === 'user';
  const hasPathMarker = !!message.pathMarker;
  const hasText = message.parts?.[0]?.text;

  // Don't render empty model messages (path markers without text)
  if (!isUser && !hasText && !hasPathMarker) {
    return null;
  }

  // Translate path name to German
  const translatePathName = (path: string): string => {
    const translations: Record<string, string> = {
      'idle': 'Gesprächsführung',
      'self_empathy': 'Selbst-Empathie',
      'other_empathy': 'Fremd-Empathie',
      'action_planning': 'Handlungsplanung',
      'conflict_resolution': 'Konfliktlösung',
      'feedback': 'Gespräch beenden',
      'memory': 'Erinnerungen',
    };
    return translations[path] || path;
  };

  // Get path marker icon based on type
  const getPathMarkerIcon = () => {
    if (!message.pathMarker) return null;
    const iconProps = { size: 14, color: baseColors.lemonade };
    
    switch (message.pathMarker.type) {
      case 'path_start': return <Play size={10} color={baseColors.lemonade} fill={baseColors.lemonade} strokeWidth={2} />;
      case 'path_switch': return <RefreshCw size={10} color="white" strokeWidth={2} />;
      case 'path_end': return <Square size={10} color="white" strokeWidth={2} />;
      default: return null;
    }
  };

  // Get path marker text with prefix based on type
  const getPathMarkerText = () => {
    if (!message.pathMarker) return '';
    const pathName = translatePathName(message.pathMarker.path);
    
    switch (message.pathMarker.type) {
      case 'path_start': return `Gestartet: ${pathName}`;
      case 'path_switch': return `Gewechselt zu: ${pathName}`;
      case 'path_end': return `Abgeschlossen: ${pathName}`;
      default: return pathName;
    }
  };

  // Clean text by removing HTML tags
  const cleanText = (text: string) => {
    return text
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/?[^>]+(>|$)/g, '')
      .trim();
  };

  return (
    <View style={[styles.container, isUser ? styles.userContainer : styles.modelContainer]}>
      {/* Path marker indicator */}
      {hasPathMarker && message.pathMarker ? (
        <View style={styles.pathMarker}>
          <View style={{ borderRadius: 12, padding: 0 }}>
            {getPathMarkerIcon()}
          </View>
          <Text style={styles.pathMarkerText}>
            {getPathMarkerText()}
          </Text>
        </View>
      ) : null}

      {/* Message bubble */}
      {hasText ? (
        <View style={[styles.bubble, isUser ? styles.userBubble : styles.modelBubble]}>
          <Text style={[styles.text, isUser ? styles.userText : styles.modelText]}>
            {cleanText(message.parts[0].text)}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    marginHorizontal: 16,
  },
  userContainer: {
    alignItems: 'flex-end',
  },
  modelContainer: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '90%',
    paddingVertical: 10,
    color: '#000000',
    marginVertical: 8,
  },
  userBubble: {
    paddingHorizontal: 16,
    borderRadius: 16,
    borderBottomRightRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 1)',
    shadowColor: 'rgba(0, 0, 0, 0.05)',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
  },
  modelBubble: {
    paddingHorizontal: 6,
    borderBottomLeftRadius: 4,
    // backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  text: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: '#000000',
  },
  modelText: {
    color: '#000000',
  },
  pathMarker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 8,
    paddingRight: 12,
    paddingVertical: 6,
    backgroundColor: baseColors.black+'11',
    boxShadow: 'inset 0 0 10px 0 '+baseColors.black+'33',
    borderRadius: 12,
    marginBottom: 8,
    alignSelf: 'center',
  },
  pathMarkerText: {
    fontSize: 12,
    color: baseColors.black,
    fontWeight: '600',
  },
});
