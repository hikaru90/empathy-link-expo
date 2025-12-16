/**
 * Message input component with send button and feelings/needs selector
 */

import Swirl from '@/assets/icons/Swirl';
import baseColors from '@/baseColors.config';
import { useChat } from '@/hooks/use-chat';
import { getFeelings, getNeeds, type Feeling, type Need } from '@/lib/api/chat';
import { Heart, Send } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Keyboard, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
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
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const { sendMessage, isSending } = useChat();
  const textInputRef = useRef<TextInput>(null);

  // Handle keyboard show/hide using React Native's Keyboard API
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const handleKeyboardShow = (e: any) => {
      const height = e.endCoordinates?.height || 0;
      console.log('[MessageInput] Keyboard show:', {
        platform: Platform.OS,
        keyboardHeight: height,
        endCoordinates: e.endCoordinates,
      });
      setKeyboardHeight(height);
    };

    const handleKeyboardHide = () => {
      console.log('[MessageInput] Keyboard hide');
      setKeyboardHeight(0);
    };

    const showSubscription = Keyboard.addListener(showEvent, handleKeyboardShow);
    const hideSubscription = Keyboard.addListener(hideEvent, handleKeyboardHide);

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

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

  // Tab bar height constant (matches tab bar configuration)
  const TAB_BAR_HEIGHT = 14;
  
  // Calculate bottom offset using tab bar height and keyboard height
  // Use fixed tab bar height instead of safe area insets for consistency
  // Safe area insets can be inconsistent on first render vs reload
  const bottomOffset = keyboardHeight > 0 
    ? keyboardHeight + 0 // When keyboard is visible, position above keyboard with padding
    : TAB_BAR_HEIGHT + 8; // When keyboard is hidden, use tab bar height + smaller padding

  // Log bottom offset whenever keyboardHeight changes
  useEffect(() => {
    console.log('[MessageInput] Bottom offset calculated:', {
      platform: Platform.OS,
      keyboardHeight,
      tabBarHeight: TAB_BAR_HEIGHT,
      bottomOffset,
      calculation: keyboardHeight > 0 
        ? `keyboardHeight (${keyboardHeight}) + 16 = ${bottomOffset}`
        : `tabBar (${TAB_BAR_HEIGHT}) + 8 = ${bottomOffset}`,
    });
  }, [keyboardHeight, bottomOffset]);

  return (
    <View
      className="shadow-lg shadow-black/10 flex flex-col gap-2 rounded-3xl"
      style={{
        backgroundColor: baseColors.background,
        position: 'absolute',
        bottom: bottomOffset,
        left: 16,
        right: 16,
        zIndex: 1000,
        maxHeight: '65%', // Prevent overflow when selectors are open
      }}
    >
      <View className="border-t border-white rounded-3xl" style={{ backgroundColor: baseColors.offwhite+'ee' }}>
      {/* Feelings Selector */}
      {feelingSelectorVisible && (
        <View className="max-h-40 border-b border-black/5">
          <GroupedFeelingsSelector
            feelings={feelings}
            onFeelingPress={addText}
            isLoading={isLoadingData}
          />
        </View>
      )}

      {/* Needs Selector */}
      {needSelectorVisible && (
        <View className="max-h-40 border-b border-black/5">
          <GroupedNeedsSelector
            needs={needs}
            onNeedPress={addText}
            isLoading={isLoadingData}
          />
        </View>
      )}

      {/* Input Row */}
      <View className="p-1 flex-row items-end gap-3 overflow-hidden">
        <TextInput
          ref={textInputRef}
          value={text}
          onChangeText={setText}
          onKeyPress={handleKeyPress}
          placeholder="Schreibe eine Nachricht..."
          placeholderTextColor="rgba(0, 0, 0, 0.5)"
          className="flex-1 rounded-[18px] p-3 text-base"
          style={styles.textInput}
          multiline
          scrollEnabled={true}
          maxLength={2000}
          editable={!isSending}
          returnKeyType="send"
          blurOnSubmit={false}
          onSubmitEditing={handleSend}
        />
      </View>

      {/* Action Buttons */}
      <View className="flex-row px-3 pb-2 gap-3 justify-between w-full">
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
            <View className="rounded-full justify-center items-center size-5" style={{ backgroundColor: baseColors.lilac }}>
              <Heart
                size={12} color={baseColors.pink} fill={baseColors.pink}
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
            <View className="rounded-full justify-center items-center size-5" style={{ backgroundColor: baseColors.lilac }}>
              <Swirl
                size={12} color={baseColors.forest}
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
    </View>
  );
}

const styles = StyleSheet.create({
  textInput: {
    minHeight: 44, // min-h-11 equivalent
    maxHeight: 104, // 4 lines: (4 * 20px line height) + (12px top padding) + (12px bottom padding) = 104px
    fontSize: 16, // text-base
    lineHeight: 20, // Approximate line height for calculation
  },
});

