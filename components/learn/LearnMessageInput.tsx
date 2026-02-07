/**
 * LearnMessageInput - shared message input for learn components
 * Encapsulates the input box, optional selectors, and action buttons
 */

import Swirl from '@/assets/icons/Swirl';
import baseColors from '@/baseColors.config';
import { ChevronLeft, ChevronRight, Heart, Send } from 'lucide-react-native';
import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export const learnInputStyles = StyleSheet.create({
  textInput: {
    minHeight: 44,
    maxHeight: 104,
    fontSize: 16,
    lineHeight: 20,
  },
  shadowButton: {
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});

export interface LearnMessageInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  disabled?: boolean;
  isLoading?: boolean;
  sendDisabled?: boolean;
  errorMessage?: string;
  textInputRef?: React.RefObject<TextInput | null>;
  /** Content above the input row (e.g. GroupedFeelingsSelector, GroupedNeedsSelector) */
  selectorContent?: React.ReactNode;
  /** Left side buttons (prev, existing response, feelings, needs) */
  leftActions: React.ReactNode;
  onKeyPress?: (e: any) => void;
  onBeforeSubmit?: () => void;
}

export default function LearnMessageInput({
  value,
  onChangeText,
  onSubmit,
  placeholder = 'Schreibe deine Antwort hier...',
  disabled = false,
  isLoading = false,
  sendDisabled = false,
  errorMessage,
  textInputRef,
  selectorContent,
  leftActions,
  onKeyPress,
  onBeforeSubmit,
}: LearnMessageInputProps) {
  const handleSubmit = () => {
    onBeforeSubmit?.();
    onSubmit();
  };

  return (
    <View style={{ overflow: 'hidden', flexShrink: 0, borderRadius: 24 }}>
      <View
        className="shadow-lg shadow-black/10 gap-2 rounded-3xl overflow-hidden"
        style={{ backgroundColor: baseColors.background, width: '100%' }}
      >
        <View
          className="border-t border-white rounded-3xl overflow-hidden"
          style={{ backgroundColor: baseColors.offwhite + 'ee' }}
        >
          {selectorContent}

          <View className="p-1 flex-row items-end gap-3 overflow-hidden">
            <TextInput
              ref={textInputRef}
              value={value}
              onChangeText={onChangeText}
              placeholder={placeholder}
              placeholderTextColor="rgba(0, 0, 0, 0.5)"
              className="flex-1 rounded-[18px] p-3 text-base"
              style={learnInputStyles.textInput}
              multiline
              scrollEnabled={true}
              maxLength={2000}
              editable={!disabled}
              returnKeyType="send"
              blurOnSubmit={false}
              onKeyPress={onKeyPress}
              onSubmitEditing={handleSubmit}
            />
          </View>

          <View className="flex-row px-3 pb-2 gap-3 justify-between w-full">
            <View className="flex-row gap-2 items-center">{leftActions}</View>
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={sendDisabled || isLoading}
              className="rounded-3xl size-10 justify-center items-center shadow-md shadow-black/10"
              style={{
                backgroundColor:
                  isLoading || sendDisabled
                    ? baseColors.forest + '33'
                    : baseColors.forest,
              }}
              activeOpacity={0.7}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Send size={16} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {errorMessage ? (
        <View className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3">
          <Text className="text-sm text-red-800">{errorMessage}</Text>
        </View>
      ) : null}
    </View>
  );
}

/** Reusable prev button for LearnMessageInput leftActions */
export function LearnInputPrevButton({
  onPress,
}: {
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex items-center gap-2 rounded-full bg-white px-1 py-1"
      style={learnInputStyles.shadowButton}
    >
      <View className="flex h-4 w-4 items-center justify-center rounded-full">
        <ChevronLeft size={12} color="#000" />
      </View>
    </TouchableOpacity>
  );
}

/** Reusable "Zur vorherigen Antwort" button for LearnMessageInput leftActions */
export function LearnInputExistingResponseButton({
  onPress,
  compact,
}: {
  onPress: () => void;
  /** When true, hide the text and show only the icon (e.g. when needs/feelings button is visible) */
  compact?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className={`flex flex-row items-center gap-2 rounded-full bg-white ${compact ? 'px-1 py-1' : 'py-1 pl-3 pr-1'}`}
      style={learnInputStyles.shadowButton}
    >
      {!compact && <Text className="text-xs">Zur vorherigen Antwort</Text>}
      <View className="flex h-4 w-4 items-center justify-center rounded-full">
        <ChevronRight size={12} color="#000" />
      </View>
    </TouchableOpacity>
  );
}

/** Feelings selector toggle button for LearnMessageInput leftActions */
export function LearnInputFeelingsButton({
  visible,
  onPress,
  disabled,
}: {
  visible: boolean;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className={`flex-row items-center gap-1.5 rounded-full pl-1 pr-3 py-1 border border-black/5 ${
        visible ? 'bg-black/5 shadow-inner' : 'bg-white shadow-sm shadow-black/20'
      }`}
      disabled={disabled}
    >
      <View
        className="rounded-full justify-center items-center size-5"
        style={{ backgroundColor: visible ? baseColors.white : baseColors.forest + '33' }}
      >
        <Heart
          size={14}
          color="transparent"
          fill={visible ? baseColors.lilac : baseColors.forest + '33'}
        />
      </View>
      <Text className="text-sm font-medium">Gefühle</Text>
    </TouchableOpacity>
  );
}

/** Needs selector toggle button for LearnMessageInput leftActions */
export function LearnInputNeedsButton({
  visible,
  onPress,
  disabled,
}: {
  visible: boolean;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className={`flex-row items-center gap-1.5 rounded-full pl-1 pr-3 py-1 border border-black/5 ${
        visible ? 'bg-black/5 shadow-inner' : 'bg-white shadow-sm shadow-black/20'
      }`}
      disabled={disabled}
    >
      <View
        className="rounded-full justify-center items-center size-5"
        style={{ backgroundColor: visible ? baseColors.white : baseColors.forest + '33' }}
      >
        <Swirl
          size={12}
          color={visible ? baseColors.forest : baseColors.forest + '55'}
        />
      </View>
      <Text className="text-sm font-medium">Bedürfnisse</Text>
    </TouchableOpacity>
  );
}
