import React from 'react';
import { Text, View } from 'react-native';
import Markdown, { MarkdownIt } from 'react-native-markdown-display';

// Initialize MarkdownIt with HTML support enabled
const markdownItInstance = MarkdownIt({ html: true });

interface LearnTextProps {
  content: string;
}

export default function LearnText({ content }: LearnTextProps) {
  return (
    <View className="flex-grow flex-col">
      <View className="flex flex-grow flex-col items-center justify-center gap-2 text-left">
        <View className="relative max-w-[20em]">
          <Markdown
            markdownit={markdownItInstance}
            style={{
              body: {
                fontSize: 18,
                color: '#1f2937',
                lineHeight: 24,
              },
              paragraph: {
                marginBottom: 12,
              },
              heading1: {
                fontSize: 24,
                fontWeight: 'bold',
                marginBottom: 8,
                color: '#111827',
              },
              heading2: {
                fontSize: 22,
                fontWeight: 'bold',
                marginBottom: 8,
                color: '#111827',
              },
              heading3: {
                fontSize: 20,
                fontWeight: 'bold',
                marginBottom: 6,
                color: '#111827',
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
              listItem: {
                marginBottom: 4,
              },
              bullet_list: {
                marginBottom: 12,
              },
              ordered_list: {
                marginBottom: 12,
              },
            }}
            rules={{
              br: (node, children, parent, styles) => (
                <Text key={node.key}>{'\n'}</Text>
              ),
            }}
          >
            {content || ''}
          </Markdown>
        </View>
      </View>
    </View>
  );
}

