import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Check, Trash } from 'lucide-react-native';

interface Memory {
  id: string;
  type: string;
  key: string;
  value: string;
  confidence: 'certain' | 'likely' | 'uncertain';
}

interface StatsMemoriesProps {
  data: Memory[];
}

const ConfidenceBadge = ({ confidence }: { confidence: string }) => {
  if (confidence === 'certain') {
    return (
      <View style={styles.confidenceBadge}>
        <View style={[styles.confidenceBar, styles.confidenceBarGreen]} />
        <View style={[styles.confidenceBar, styles.confidenceBarGreen]} />
        <View style={[styles.confidenceBar, styles.confidenceBarGreen]} />
      </View>
    );
  } else if (confidence === 'likely') {
    return (
      <View style={styles.confidenceBadge}>
        <View style={[styles.confidenceBar, styles.confidenceBarBlue]} />
        <View style={[styles.confidenceBar, styles.confidenceBarBlue]} />
        <View style={[styles.confidenceBar, styles.confidenceBarGray]} />
      </View>
    );
  } else {
    return (
      <View style={styles.confidenceBadge}>
        <View style={[styles.confidenceBar, styles.confidenceBarOrange]} />
        <View style={[styles.confidenceBar, styles.confidenceBarGray]} />
        <View style={[styles.confidenceBar, styles.confidenceBarGray]} />
      </View>
    );
  }
};

export default function StatsMemories({ data }: StatsMemoriesProps) {
  const [selectedMemories, setSelectedMemories] = useState<string[]>([]);

  const communicationInsights = data.filter(
    (memory) => memory.type === 'value' || memory.type === 'emotion'
  );

  const selectMemory = (id: string) => {
    if (selectedMemories.includes(id)) {
      setSelectedMemories(selectedMemories.filter((memId) => memId !== id));
    } else {
      setSelectedMemories([...selectedMemories, id]);
    }
  };

  const deleteMemories = async () => {
    // TODO: Implement deletion logic
    console.log('Delete memories:', selectedMemories);
    setSelectedMemories([]);
  };

  return (
    <View>
      <View style={styles.headerActions}>
        {selectedMemories.length > 0 && (
          <TouchableOpacity style={styles.deleteButton} onPress={deleteMemories}>
            <Text style={styles.deleteButtonText}>löschen</Text>
            <Trash size={16} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.container}>
        {communicationInsights.map((memory, index) => (
          <View
            key={memory.id}
            style={[
              styles.memoryItem,
              index === communicationInsights.length - 1 && styles.lastMemoryItem,
            ]}
          >
            <TouchableOpacity
              style={styles.checkbox}
              onPress={() => selectMemory(memory.id)}
            >
              <View style={styles.checkboxCircle}>
                {selectedMemories.includes(memory.id) ? (
                  <Check size={12} color="#000" />
                ) : (
                  <View style={{ width: 12, height: 12 }} />
                )}
              </View>
            </TouchableOpacity>

            <View style={styles.memoryContent}>
              <View style={styles.confidenceContainer}>
                <Text style={styles.confidenceLabel}>Gewissheit</Text>
                <ConfidenceBadge confidence={memory.confidence} />
              </View>

              <Text style={styles.memoryKey}>{memory.key}</Text>
              <Text style={styles.memoryValue}>{memory.value}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerActions: {
    height: 32,
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ef4444',
    paddingVertical: 4,
    paddingLeft: 16,
    paddingRight: 8,
    borderRadius: 20,
  },
  deleteButtonText: {
    fontSize: 14,
    color: '#fff',
  },
  container: {
    marginBottom: 64,
  },
  memoryItem: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 8,
    borderRadius: 22,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.02)',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 8,
  },
  lastMemoryItem: {
    borderBottomWidth: 0,
  },
  checkbox: {
    borderRightWidth: 1,
    borderRightColor: 'rgba(0, 0, 0, 0.02)',
    paddingVertical: 8,
    paddingRight: 4,
    justifyContent: 'flex-start',
  },
  checkboxCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  memoryContent: {
    position: 'relative',
    flex: 1,
    paddingVertical: 8,
    gap: 8,
  },
  confidenceContainer: {
    position: 'absolute',
    right: 0,
    top: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  confidenceLabel: {
    fontSize: 12,
    color: '#666',
  },
  confidenceBadge: {
    flexDirection: 'row',
    gap: 1,
  },
  confidenceBar: {
    width: 8,
    height: 12,
    borderRadius: 4,
  },
  confidenceBarGreen: {
    backgroundColor: '#10b981',
    borderRightWidth: 1,
    borderRightColor: 'rgba(0, 0, 0, 0.05)',
  },
  confidenceBarBlue: {
    backgroundColor: '#93c5fd',
    borderRightWidth: 1,
    borderRightColor: 'rgba(0, 0, 0, 0.05)',
  },
  confidenceBarOrange: {
    backgroundColor: '#f97316',
  },
  confidenceBarGray: {
    backgroundColor: '#f5f5f5',
  },
  memoryKey: {
    maxWidth: '60%',
    marginBottom: 16,
    color: '#666',
    fontSize: 14,
  },
  memoryValue: {
    marginBottom: 8,
    fontSize: 14,
    color: '#000',
  },
});
