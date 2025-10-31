/**
 * Message input component with send button and feelings/needs selector
 */

import Swirl from '@/assets/icons/Swirl';
import baseColors from '@/baseColors.config';
import { useChat } from '@/hooks/use-chat';
import { getFeelings, getNeeds, type Feeling, type Need } from '@/lib/api/chat';
import { Heart, Send } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, Text, TextInput, TouchableOpacity, View } from 'react-native';
import GroupedFeelingsSelector from './GroupedFeelingsSelector';
import GroupedNeedsSelector from './GroupedNeedsSelector';

interface MessageInputProps {
  onSelectorStateChange?: (feelingSelectorVisible: boolean, needSelectorVisible: boolean) => void;
}

export default function MessageInput({ onSelectorStateChange }: MessageInputProps = {}) {
  const [text, setText] = useState('');
  const [feelings, setFeelings] = useState<Feeling[]>([]);
  const [needs, setNeeds] = useState<Need[]>([]);
  const [feelingSelectorVisible, setFeelingSelectorVisible] = useState(false);
  const [needSelectorVisible, setNeedSelectorVisible] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const { sendMessage, isSending } = useChat();
  const textInputRef = useRef<TextInput>(null);

  // Load feelings and needs data
  useEffect(() => {
    const loadData = async () => {
      setIsLoadingData(true);
      try {
        const [feelingsData, needsData] = await Promise.all([
          getFeelings(),
          getNeeds()
        ]);
        setFeelings(feelingsData);
        setNeeds(needsData);
      } catch (error) {
        console.error('Failed to load feelings/needs:', error);
      } finally {
        setIsLoadingData(false);
      }
    };

    loadData();
  }, []);

  // Notify parent component when selector states change
  useEffect(() => {
    onSelectorStateChange?.(feelingSelectorVisible, needSelectorVisible);
  }, [feelingSelectorVisible, needSelectorVisible, onSelectorStateChange]);

  const handleSend = async () => {
    if (!text.trim() || isSending) return;

    const messageToSend = text.trim();
    setText(''); // Clear input immediately
    setFeelingSelectorVisible(false);
    setNeedSelectorVisible(false);

    await sendMessage(messageToSend);
  };

  const handleKeyPress = (e: any) => {
    // Send on Enter (without Shift) on web
    if (Platform.OS === 'web' && e.nativeEvent.key === 'Enter' && !e.nativeEvent.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const addText = (textToAdd: string) => {
    const currentText = text;
    const cursorPosition = (textInputRef.current as any)?.selectionStart || currentText.length;

    // Add space before if needed
    let formattedText = textToAdd;
    if (cursorPosition > 0 && currentText[cursorPosition - 1] !== ' ') {
      formattedText = ' ' + textToAdd;
    }

    // Add space after if needed
    if (cursorPosition < currentText.length && currentText[cursorPosition] !== ' ') {
      formattedText = formattedText + ' ';
    }

    const newText = currentText.substring(0, cursorPosition) + formattedText + currentText.substring(cursorPosition);
    setText(newText);

    // Focus back to input
    setTimeout(() => {
      textInputRef.current?.focus();
    }, 100);
  };

  const toggleFeelingSelector = useCallback(() => {
    setNeedSelectorVisible(false);
    setFeelingSelectorVisible(prev => !prev);
  }, []);

  const toggleNeedSelector = useCallback(() => {
    setFeelingSelectorVisible(false);
    setNeedSelectorVisible(prev => !prev);
  }, []);

  return (
    <View
      className="bg-white border-t border-gray-200 rounded-3xl shadow-lg shadow-black/10 flex flex-col gap-2"
      style={{
        position: 'absolute',
        bottom: Platform.OS === 'ios' ? 88 : 16, // More space on iOS for home indicator
        left: 16,
        right: 16,
        zIndex: 1000,
        maxHeight: '65%', // Prevent overflow when selectors are open
      }}
    >
      {/* Feelings Selector */}
      {feelingSelectorVisible && (
        <View className="max-h-40 border-b border-gray-200">
          <GroupedFeelingsSelector
            feelings={feelings}
            onFeelingPress={addText}
            isLoading={isLoadingData}
          />
        </View>
      )}

      {/* Needs Selector */}
      {needSelectorVisible && (
        <View className="max-h-40 border-b border-gray-200">
          <GroupedNeedsSelector
            needs={needs}
            onNeedPress={addText}
            isLoading={isLoadingData}
          />
        </View>
      )}

      {/* Input Row */}
      <View className="p-2 flex-row items-end gap-3 rounded-t-3xl overflow-hidden">
        <TextInput
          ref={textInputRef}
          value={text}
          onChangeText={setText}
          onKeyPress={handleKeyPress}
          placeholder="Schreibe eine Nachricht..."
          placeholderTextColor="rgba(0, 0, 0, 0.5)"
          className="flex-1 bg-white/90 rounded-2xl p-3 text-base max-h-30 min-h-11 "
          multiline
          maxLength={2000}
          editable={!isSending}
          returnKeyType="send"
          blurOnSubmit={false}
          onSubmitEditing={handleSend}
        />
      </View>

      {/* Action Buttons */}
      <View className="flex-row px-4 pb-4 gap-3 justify-between w-full">
        <View className="flex-row gap-2 items-center">
          <TouchableOpacity
            onPress={toggleFeelingSelector}
            className={`flex-row items-center gap-1.5 rounded-full pl-1 pr-3 py-1 border border-black/5 ${
              feelingSelectorVisible
                ? 'bg-black/5 shadow-inner'
                : 'bg-white shadow-sm shadow-black/20'
              }`}
            disabled={isLoadingData}
          >
            <View className="bg-red-300 rounded-full justify-center items-center size-5">
              <Heart
                size={12} color="red" fill="red"
              />
            </View>
            <Text className={`text-sm font-medium`}>
              Gefühle
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={toggleNeedSelector}
            className={`flex-row items-center gap-1.5 rounded-full pl-1 pr-3 py-1 border border-black/5 ${needSelectorVisible
              ? 'bg-black/5 shadow-inner'
              : 'bg-white shadow-sm shadow-black/20'
              }`}
            disabled={isLoadingData}
          >
            <View className="bg-green-200 rounded-full justify-center items-center size-5">
              <Swirl
                size={12} color="green"
              />
            </View>
            <Text className={`text-sm font-medium`}>
              Bedürfnisse
            </Text>
          </TouchableOpacity>

        </View>
        <TouchableOpacity
          onPress={handleSend}
          disabled={isSending || !text.trim()}
          className="rounded-3xl size-10 justify-center items-center shadow-md shadow-black/10"
          style={{
            backgroundColor: isSending || !text.trim() 
              ? '#dddddd' 
              : `${baseColors.lilac}`
          }}
          activeOpacity={0.7}
        >
          {isSending ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Send size={16} color={isSending || !text.trim() ? "#ffffff" : "#ffffff"} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

